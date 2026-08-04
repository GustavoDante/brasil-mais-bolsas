import {
  DurationType,
  PaymentType,
  PersonType,
  ScholarshipType,
} from '@repo/db';
import type { LegacyRow } from './legacy-db';

/**
 * Date used when the new schema requires a non-null date and the legacy row has none.
 * It is intentionally absurd so the records are easy to find and fix later.
 */
export const MISSING_DATE = new Date('1900-01-01T00:00:00.000Z');

/** Domain used to rebuild e-mails that are missing or duplicated in the legacy database. */
export const MIGRATION_EMAIL_DOMAIN = 'migrado.brasilmaisbolsas.local';

/** Returns the first non-null value among the candidate columns. */
export function read(row: LegacyRow, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

export function text(row: LegacyRow, keys: string[]): string | null {
  const value = read(row, keys);
  if (value === null) return null;
  const asText = String(value).trim();
  return asText.length === 0 ? null : asText;
}

export function requiredText(row: LegacyRow, keys: string[], fallback = ''): string {
  return text(row, keys) ?? fallback;
}

export function integer(row: LegacyRow, keys: string[]): number | null {
  const value = read(row, keys);
  if (value === null) return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/**
 * Legacy money columns are FLOAT, the new ones are DECIMAL(12,2).
 * Prisma accepts a string for Decimal, which avoids float rounding surprises.
 */
export function decimal(row: LegacyRow, keys: string[]): string | null {
  const value = read(row, keys);
  if (value === null) return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return null;
  return parsed.toFixed(2);
}

export function bool(row: LegacyRow, keys: string[], fallback: boolean): boolean {
  const value = read(row, keys);
  if (value === null) return fallback;
  if (typeof value === 'boolean') return value;
  const asText = String(value).trim().toLowerCase();
  if (['true', 't', '1', 'yes', 'y'].includes(asText)) return true;
  if (['false', 'f', '0', 'no', 'n'].includes(asText)) return false;
  return fallback;
}

export function nullableBool(row: LegacyRow, keys: string[]): boolean | null {
  return read(row, keys) === null ? null : bool(row, keys, false);
}

export function date(row: LegacyRow, keys: string[]): Date | null {
  const value = read(row, keys);
  if (value === null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const TIMESTAMP_CREATED = ['created_at', 'createdAt'];
export const TIMESTAMP_UPDATED = ['updated_at', 'updatedAt'];

export function createdAt(row: LegacyRow): Date {
  return date(row, TIMESTAMP_CREATED) ?? date(row, TIMESTAMP_UPDATED) ?? new Date();
}

export function updatedAt(row: LegacyRow): Date {
  return date(row, TIMESTAMP_UPDATED) ?? createdAt(row);
}

export function normalizeEmail(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 ? null : normalized;
}

/** Builds a unique placeholder e-mail for users/records without a usable one. */
export function placeholderEmail(prefix: string, legacyKey: string | number): string {
  return `${prefix}-${legacyKey}@${MIGRATION_EMAIL_DOMAIN}`;
}

/** Appends a `+legacy<id>` tag to an e-mail so duplicates can coexist under a UNIQUE index. */
export function disambiguateEmail(email: string | null, legacyKey: string | number): string {
  if (!email || !email.includes('@')) return placeholderEmail('legacy-user', legacyKey);
  const [local, domain] = email.split('@');
  return `${local}+legacy${legacyKey}@${domain}`;
}

const COMBINING_MARKS = /[̀-ͯ]/g;

function slug(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

export interface Mapped<T> {
  value: T;
  /** True when the legacy value could not be recognised and a default was applied. */
  fallback: boolean;
  /** The raw legacy value, for the report. */
  raw: string | null;
}

/** `days` | `months` | `years` -> DurationType */
export function mapDurationType(value: unknown): Mapped<DurationType> {
  const raw = value === null || value === undefined ? null : String(value);
  switch (slug(value)) {
    case 'days':
    case 'day':
    case 'dias':
    case 'dia':
      return { value: DurationType.DAYS, fallback: false, raw };
    case 'months':
    case 'month':
    case 'meses':
    case 'mes':
      return { value: DurationType.MONTHS, fallback: false, raw };
    case 'years':
    case 'year':
    case 'anos':
    case 'ano':
      return { value: DurationType.YEARS, fallback: false, raw };
    default:
      return { value: DurationType.MONTHS, fallback: true, raw };
  }
}

/** `presencial` | `semi-presencial` | `ead` -> ScholarshipType */
export function mapScholarshipType(value: unknown): Mapped<ScholarshipType> {
  const raw = value === null || value === undefined ? null : String(value);
  switch (slug(value)) {
    case 'presencial':
      return { value: ScholarshipType.PRESENCIAL, fallback: false, raw };
    case 'semi-presencial':
    case 'semipresencial':
    case 'semi-presential':
      return { value: ScholarshipType.SEMI_PRESENCIAL, fallback: false, raw };
    case 'ead':
    case 'a-distancia':
    case 'online':
      return { value: ScholarshipType.EAD, fallback: false, raw };
    default:
      return { value: ScholarshipType.PRESENCIAL, fallback: true, raw };
  }
}

/** Legacy payment_type mixed lower/upper case values -> PaymentType (nullable). */
export function mapPaymentType(value: unknown): Mapped<PaymentType | null> {
  const raw = value === null || value === undefined ? null : String(value);
  if (raw === null || raw.trim().length === 0) return { value: null, fallback: false, raw };

  switch (slug(value)) {
    case 'boleto':
    case 'bank-slip':
      return { value: PaymentType.BOLETO, fallback: false, raw };
    case 'credit-card':
    case 'creditcard':
    case 'cartao':
    case 'cartao-de-credito':
      return { value: PaymentType.CREDIT_CARD, fallback: false, raw };
    case 'pix':
      return { value: PaymentType.PIX, fallback: false, raw };
    case 'interest':
    case 'juros':
      return { value: PaymentType.INTEREST, fallback: false, raw };
    case 'refunded':
    case 'estornado':
      return { value: PaymentType.REFUNDED, fallback: false, raw };
    case 'cancelled':
    case 'canceled':
    case 'cancelado':
      return { value: PaymentType.CANCELLED, fallback: false, raw };
    case 'undefined':
      return { value: PaymentType.UNDEFINED, fallback: false, raw };
    default:
      return { value: PaymentType.UNDEFINED, fallback: true, raw };
  }
}

/** `FISICA` | `JURIDICA`; falls back to the CPF/CNPJ length when the column is empty. */
export function mapPersonType(value: unknown, cpfCnpj: string | null): Mapped<PersonType> {
  const raw = value === null || value === undefined ? null : String(value);
  switch (slug(value)) {
    case 'fisica':
    case 'f':
      return { value: PersonType.FISICA, fallback: false, raw };
    case 'juridica':
    case 'j':
      return { value: PersonType.JURIDICA, fallback: false, raw };
    default: {
      const digits = (cpfCnpj ?? '').replace(/\D/g, '');
      const inferred = digits.length > 11 ? PersonType.JURIDICA : PersonType.FISICA;
      return { value: inferred, fallback: true, raw };
    }
  }
}

/** Payment/order status stays a free-form string in the new schema, only normalised. */
export function normalizeStatus(value: string | null, fallback = 'UNDEFINED'): string {
  if (!value) return fallback;
  return value.trim().toUpperCase().replace(/\s+/g, '_');
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
