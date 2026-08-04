import { z } from 'zod';

import { apiEnvelope } from '../common';
import { CourseCategorySchema } from '../models';
import { zOptionalInt, zText } from '../primitives';

export const CreateCourseCategorySchema = z
  .object({
    name: zText('Informe o nome da categoria'),
    old_id: z.string().optional(),
    order: zOptionalInt(),
  })
  .strict()
  .meta({ id: 'CreateCourseCategory' });

export const UpdateCourseCategorySchema = z
  .object({
    name: zText('Informe o nome da categoria'),
    order: zOptionalInt(),
  })
  .partial()
  .strict()
  .meta({ id: 'UpdateCourseCategory' });

export const CourseCategoryResponseSchema = CourseCategorySchema.meta({
  id: 'CourseCategoryResponse',
});

export const CourseCategoryEnvelopeSchema = apiEnvelope(
  'courseCategory',
  CourseCategoryResponseSchema,
);

/**
 * A listagem responde ora em `categories`, ora em `courseCategories` conforme a rota —
 * os dois nomes são mantidos opcionais para o cliente aceitar qualquer uma sem quebrar.
 */
export const CourseCategoryListEnvelopeSchema = z
  .object({
    ok: z.boolean(),
    message: z.string().optional(),
    categories: z.array(CourseCategoryResponseSchema).optional(),
    courseCategories: z.array(CourseCategoryResponseSchema).optional(),
  })
  .meta({ id: 'CourseCategoryListEnvelope' });

export type CreateCourseCategoryInput = z.infer<typeof CreateCourseCategorySchema>;
export type UpdateCourseCategoryInput = z.infer<typeof UpdateCourseCategorySchema>;
export type CourseCategoryResponse = z.infer<typeof CourseCategoryResponseSchema>;
export type CourseCategoryListEnvelope = z.infer<typeof CourseCategoryListEnvelopeSchema>;
