import { createHash } from 'node:crypto';

/**
 * The legacy database used auto-increment integers, the new one uses cuid-like strings.
 *
 * The mapping is deterministic (sha256 of `<entity>:<legacyId>` rendered in base36) so that:
 *  - foreign keys can be resolved without keeping a translation table;
 *  - the migration can be re-run and always produces the same ids (idempotent upserts);
 *  - a legacy record can be located again by recomputing its id.
 */
export function legacyId(entity: string, value: string | number): string {
  const digest = createHash('sha256').update(`${entity}:${value}`).digest('hex');
  const base36 = BigInt(`0x${digest}`).toString(36);
  return `c${base36.padStart(24, '0')}`.slice(0, 25);
}

/** Same as {@link legacyId} but tolerant to null/empty legacy references. */
export function optionalLegacyId(entity: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = typeof value === 'number' ? value : String(value).trim();
  if (raw === '' || raw === '0') return null;
  return legacyId(entity, raw as string | number);
}

export type IdLoader = () => Promise<{ id: string }[]>;

/**
 * Keeps track of which parent ids exist in the target database, so child rows pointing to
 * records that were skipped (or that never existed — the legacy schema had no real foreign
 * keys) can be detected before Postgres rejects them.
 */
export class IdRegistry {
  private readonly cache = new Map<string, Set<string>>();

  constructor(private readonly loaders: Record<string, IdLoader>) {}

  async ids(model: string): Promise<Set<string>> {
    const cached = this.cache.get(model);
    if (cached) return cached;

    const loader = this.loaders[model];
    if (!loader) throw new Error(`Nenhum loader de ids registrado para o modelo "${model}"`);

    const rows = await loader();
    const set = new Set(rows.map((row) => row.id));
    this.cache.set(model, set);
    return set;
  }

  async has(model: string, id: string | null | undefined): Promise<boolean> {
    if (!id) return false;
    const set = await this.ids(model);
    return set.has(id);
  }

  async add(model: string, ids: string[]): Promise<void> {
    const set = await this.ids(model);
    for (const id of ids) set.add(id);
  }
}
