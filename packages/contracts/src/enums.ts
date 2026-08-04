import { z } from 'zod';

import { DurationTypeSchema } from './generated/schemas/enums/DurationType.schema';
import { PaymentTypeSchema } from './generated/schemas/enums/PaymentType.schema';
import { PersonTypeSchema } from './generated/schemas/enums/PersonType.schema';
import { ScholarshipTypeSchema } from './generated/schemas/enums/ScholarshipType.schema';

/**
 * Enums do domínio, gerados do `schema.prisma`.
 *
 * Os `*ScalarFieldEnum`, `SortOrder`, `QueryMode` e afins também são gerados, mas são
 * detalhe interno do Prisma e **não** fazem parte do contrato HTTP — por isso não são
 * reexportados aqui.
 */

export { DurationTypeSchema, PaymentTypeSchema, PersonTypeSchema, ScholarshipTypeSchema };

export type ScholarshipType = z.infer<typeof ScholarshipTypeSchema>;
export type DurationType = z.infer<typeof DurationTypeSchema>;
export type PaymentType = z.infer<typeof PaymentTypeSchema>;
export type PersonType = z.infer<typeof PersonTypeSchema>;

/**
 * Listas de valores para UI (selects, checkboxes) e para `z.enum` derivados.
 * Vêm do próprio schema Zod, então acrescentar um valor no Prisma propaga sozinho.
 */
export const SCHOLARSHIP_TYPES = ScholarshipTypeSchema.options;
export const DURATION_TYPES = DurationTypeSchema.options;
export const PAYMENT_TYPES = PaymentTypeSchema.options;
export const PERSON_TYPES = PersonTypeSchema.options;
