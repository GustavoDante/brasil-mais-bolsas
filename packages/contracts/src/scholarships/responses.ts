import { z } from 'zod';

import { apiEnvelope, NamedEntitySchema } from '../common';
import { CourseCategorySchema, CourseSchema, InstitutionSchema, ScholarshipSchema } from '../models';

/**
 * Curso e categoria como aparecem embutidos numa bolsa — o recorte que a API seleciona,
 * derivado do model para que um `.pick()` quebre se o campo sumir do schema.
 */
export const CourseCategorySummarySchema = CourseCategorySchema.pick({
  id: true,
  name: true,
  order: true,
  active: true,
}).meta({ id: 'CourseCategorySummary' });

export const CourseSummarySchema = CourseSchema.pick({
  id: true,
  name: true,
  duration: true,
  duration_type: true,
  category_id: true,
  active: true,
})
  .extend({
    category: CourseCategorySummarySchema.nullish(),
  })
  .meta({ id: 'CourseSummary' });

/** Instituição no formato reduzido das listagens públicas de bolsas. */
export const InstitutionSummarySchema = InstitutionSchema.pick({
  id: true,
  name: true,
  image: true,
  city: true,
  district: true,
  state: true,
})
  .partial({ image: true, city: true, district: true, state: true })
  .meta({ id: 'InstitutionSummary' });

/**
 * Bolsa como a API devolve.
 *
 * `full_price`, `discount` e `final_price` são **string**: o service repassa o
 * `Prisma.Decimal` e o JSON o serializa assim. Na entrada eles são number — ver
 * `requests.ts`.
 */
export const ScholarshipResponseSchema = ScholarshipSchema.extend({
  course: CourseSummarySchema.nullish(),
  institution: InstitutionSummarySchema.nullish(),
  /** Pagamentos confirmados — usado para calcular as vagas restantes. */
  payments_count: z.number().int().optional(),
}).meta({ id: 'ScholarshipResponse' });

export const ScholarshipEnvelopeSchema = apiEnvelope('scholarship', ScholarshipResponseSchema);
export const ScholarshipListEnvelopeSchema = apiEnvelope(
  'scholarships',
  z.array(ScholarshipResponseSchema),
);

/**
 * Item de `GET /v1/scholarships/list/index` (vitrine da home).
 * Devolve dados da **instituição** — menor mensalidade e maior desconto —, não da bolsa.
 */
export const HomeShowcaseItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullish(),
    final_price: z.string(),
    discount: z.string(),
  })
  .meta({ id: 'HomeShowcaseItem' });

export const HomeShowcaseEnvelopeSchema = apiEnvelope(
  'scholarships',
  z.array(HomeShowcaseItemSchema),
);

export const CitySchema = z.object({ name: z.string() }).meta({ id: 'City' });

export const CityListEnvelopeSchema = apiEnvelope('cities', z.array(CitySchema));
export const InstitutionOptionsEnvelopeSchema = apiEnvelope(
  'institutions',
  z.array(NamedEntitySchema),
);
export const CourseOptionsEnvelopeSchema = apiEnvelope('courses', z.array(NamedEntitySchema));

export type CourseCategorySummary = z.infer<typeof CourseCategorySummarySchema>;
export type CourseSummary = z.infer<typeof CourseSummarySchema>;
export type InstitutionSummary = z.infer<typeof InstitutionSummarySchema>;
export type ScholarshipResponse = z.infer<typeof ScholarshipResponseSchema>;
export type ScholarshipEnvelope = z.infer<typeof ScholarshipEnvelopeSchema>;
export type ScholarshipListEnvelope = z.infer<typeof ScholarshipListEnvelopeSchema>;
export type HomeShowcaseItem = z.infer<typeof HomeShowcaseItemSchema>;
export type HomeShowcaseEnvelope = z.infer<typeof HomeShowcaseEnvelopeSchema>;
export type City = z.infer<typeof CitySchema>;
export type CityListEnvelope = z.infer<typeof CityListEnvelopeSchema>;
