import type { PrismaClient } from '@repo/db';
import type { MigrationConfig } from './config';
import type { IdRegistry } from './ids';
import type { LegacySource } from './legacy-db';
import type { MigrationReport } from './report';
import { chunk } from './transforms';

export interface MigrationContext {
  config: MigrationConfig;
  legacy: LegacySource;
  prisma: PrismaClient;
  report: MigrationReport;
  ids: IdRegistry;
}

export interface MigrationStep {
  /** Identifier used by --only / --skip. */
  name: string;
  description: string;
  /** Candidate legacy table names; the first one that exists is used. */
  sources: string[];
  run(ctx: MigrationContext, table: string): Promise<void>;
}

export interface ModelWriter<T extends { id: string }> {
  /** Prisma model name, used by the id registry (e.g. `user`, `courseCategory`). */
  model: string;
  createMany(rows: T[]): Promise<{ count: number }>;
  upsert(row: T): Promise<unknown>;
}

/**
 * Buffers transformed rows and writes them in batches.
 *
 * - `--on-conflict=skip` (default): `createMany({ skipDuplicates: true })`.
 * - `--on-conflict=update`: row-by-row upsert, so re-running the migration refreshes data.
 * - On a failed batch it retries row by row, so a single bad record does not lose the batch.
 * - In `--dry-run` nothing is written, but the ids are still registered so the following
 *   steps can validate their foreign keys exactly like a real run.
 */
export class BatchWriter<T extends { id: string }> {
  private buffer: T[] = [];

  constructor(
    private readonly ctx: MigrationContext,
    private readonly step: string,
    private readonly writer: ModelWriter<T>,
  ) {}

  async push(row: T): Promise<void> {
    this.buffer.push(row);
    if (this.buffer.length >= this.ctx.config.batchSize) await this.flush();
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const rows = this.buffer;
    this.buffer = [];

    if (this.ctx.config.dryRun) {
      await this.registerAndCount(rows);
      return;
    }

    if (this.ctx.config.onConflict === 'update') {
      await this.upsertRows(rows);
      return;
    }

    try {
      await this.writer.createMany(rows);
      await this.registerAndCount(rows);
    } catch {
      await this.retryOneByOne(rows);
    }
  }

  private async upsertRows(rows: T[]): Promise<void> {
    // Small concurrency window: fast enough without exhausting the connection pool.
    for (const group of chunk(rows, 20)) {
      const results = await Promise.allSettled(group.map((row) => this.writer.upsert(row)));
      const persisted: T[] = [];
      results.forEach((result, index) => {
        const row = group[index];
        if (result.status === 'fulfilled') {
          persisted.push(row);
        } else {
          this.ctx.report.failed(this.step, row.id, 'falha-ao-gravar', describe(result.reason));
        }
      });
      await this.registerAndCount(persisted);
    }
  }

  private async retryOneByOne(rows: T[]): Promise<void> {
    for (const row of rows) {
      try {
        await this.writer.createMany([row]);
        await this.registerAndCount([row]);
      } catch (error) {
        this.ctx.report.failed(this.step, row.id, 'falha-ao-gravar', describe(error));
      }
    }
  }

  private async registerAndCount(rows: T[]): Promise<void> {
    if (rows.length === 0) return;
    this.ctx.report.stat(this.step).written += rows.length;
    await this.ctx.ids.add(
      this.writer.model,
      rows.map((row) => row.id),
    );
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message.split('\n')[0]}`;
  return String(error);
}
