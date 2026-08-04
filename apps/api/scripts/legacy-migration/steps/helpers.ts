import type { MigrationContext } from '../lib/context';
import { optionalLegacyId } from '../lib/ids';
import type { LegacyRow } from '../lib/legacy-db';
import { MISSING_DATE, date, decimal, integer, text } from '../lib/transforms';

/**
 * Resolves a legacy foreign key into the new id, returning null when the target row does not
 * exist in the new database. The legacy schema declared every association with
 * `constraints: false`, so orphan references are expected and must not abort the migration.
 */
export async function parentId(
  ctx: MigrationContext,
  model: string,
  legacyValue: unknown,
): Promise<string | null> {
  const id = optionalLegacyId(model, legacyValue);
  if (!id) return null;
  return (await ctx.ids.has(model, id)) ? id : null;
}

/** Required TEXT column in the new schema: falls back to an empty string and reports it. */
export function requireText(
  ctx: MigrationContext,
  step: string,
  legacyKey: string | number,
  row: LegacyRow,
  keys: string[],
  field: string,
  fallback = '',
): string {
  const value = text(row, keys);
  if (value !== null) return value;
  ctx.report.coerced(step, legacyKey, `campo-obrigatorio-vazio:${field}`);
  return fallback;
}

/** Required TIMESTAMP column: falls back to {@link MISSING_DATE} and reports it. */
export function requireDate(
  ctx: MigrationContext,
  step: string,
  legacyKey: string | number,
  row: LegacyRow,
  keys: string[],
  field: string,
  fallback: Date = MISSING_DATE,
): Date {
  const value = date(row, keys);
  if (value !== null) return value;
  ctx.report.coerced(step, legacyKey, `data-obrigatoria-vazia:${field}`);
  return fallback;
}

/** Required DECIMAL column: falls back to "0.00" and reports it. */
export function requireDecimal(
  ctx: MigrationContext,
  step: string,
  legacyKey: string | number,
  row: LegacyRow,
  keys: string[],
  field: string,
  fallback = '0.00',
): string {
  const value = decimal(row, keys);
  if (value !== null) return value;
  ctx.report.coerced(step, legacyKey, `valor-obrigatorio-vazio:${field}`);
  return fallback;
}

/** Required INTEGER column: falls back to 0 (or the given default) and reports it. */
export function requireInt(
  ctx: MigrationContext,
  step: string,
  legacyKey: string | number,
  row: LegacyRow,
  keys: string[],
  field: string,
  fallback = 0,
): number {
  const value = integer(row, keys);
  if (value !== null) return value;
  ctx.report.coerced(step, legacyKey, `numero-obrigatorio-vazio:${field}`);
  return fallback;
}

export function legacyKeyOf(row: LegacyRow): string {
  return String(row['id'] ?? '');
}
