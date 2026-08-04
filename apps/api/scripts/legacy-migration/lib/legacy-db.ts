import { Pool } from 'pg';

export type LegacyRow = Record<string, unknown>;

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Read-only access to the legacy (Sequelize) database.
 *
 * The legacy project mixed `sequelize.sync()` with hand written migrations, so table and
 * column names are not fully predictable (`users` vs `Users`, `created_at` vs `createdAt`,
 * `institutionName` vs `institution_name`). Everything here is resolved by introspection
 * instead of being hard coded.
 */
export class LegacySource {
  private readonly pool: Pool;
  private tableIndex: Map<string, string> | null = null;
  private readonly columnCache = new Map<string, Set<string>>();

  constructor(connectionString: string, ssl: boolean) {
    this.pool = new Pool({
      connectionString,
      ssl: ssl ? { rejectUnauthorized: false } : undefined,
      max: 4,
      // A single legacy table can be large; keep statements from hanging forever.
      statement_timeout: 300_000,
    });
  }

  async query<T extends LegacyRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /** Map of lowercased table name -> real table name, for the `public` schema. */
  private async tables(): Promise<Map<string, string>> {
    if (this.tableIndex) return this.tableIndex;
    const rows = await this.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    this.tableIndex = new Map(rows.map((row) => [row.table_name.toLowerCase(), row.table_name]));
    return this.tableIndex;
  }

  /** Returns the first candidate that actually exists in the legacy database. */
  async resolveTable(candidates: string[]): Promise<string | null> {
    const tables = await this.tables();
    for (const candidate of candidates) {
      const found = tables.get(candidate.toLowerCase());
      if (found) return found;
    }
    return null;
  }

  async columns(table: string): Promise<Set<string>> {
    const cached = this.columnCache.get(table);
    if (cached) return cached;
    const rows = await this.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    const columns = new Set(rows.map((row) => row.column_name));
    this.columnCache.set(table, columns);
    return columns;
  }

  /** Resolves the first existing column among the candidates (case sensitive names). */
  async column(table: string, candidates: string[]): Promise<string | null> {
    const columns = await this.columns(table);
    for (const candidate of candidates) {
      if (columns.has(candidate)) return candidate;
    }
    return null;
  }

  async count(table: string): Promise<number> {
    const rows = await this.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM public.${quoteIdentifier(table)}`,
    );
    return Number.parseInt(rows[0]?.total ?? '0', 10);
  }

  /**
   * Reads a projection of the table (only the given columns) in one shot.
   * Used by the pre-passes that need to plan de-duplication before importing.
   */
  async project<T extends LegacyRow>(table: string, columns: string[]): Promise<T[]> {
    const select = columns.map(quoteIdentifier).join(', ');
    return this.query<T>(
      `SELECT ${select} FROM public.${quoteIdentifier(table)} ORDER BY "id" ASC`,
    );
  }

  /** Keyset pagination over the table primary key (`id` exists in every legacy table). */
  async *stream(
    table: string,
    options: { batchSize: number; limit: number | null },
  ): AsyncGenerator<LegacyRow[]> {
    const relation = `public.${quoteIdentifier(table)}`;
    let cursor: unknown = null;
    let fetched = 0;

    for (;;) {
      const remaining = options.limit === null ? options.batchSize : options.limit - fetched;
      const size = Math.min(options.batchSize, remaining);
      if (size <= 0) return;

      const rows =
        cursor === null
          ? await this.query(`SELECT * FROM ${relation} ORDER BY "id" ASC LIMIT $1`, [size])
          : await this.query(
              `SELECT * FROM ${relation} WHERE "id" > $2 ORDER BY "id" ASC LIMIT $1`,
              [size, cursor],
            );

      if (rows.length === 0) return;

      yield rows;

      fetched += rows.length;
      cursor = rows[rows.length - 1]?.['id'] ?? null;
      if (cursor === null || rows.length < size) return;
    }
  }
}
