import { z } from 'zod';

import { apiEnvelope, NamedEntitySchema } from '../common';
import { DurationTypeSchema } from '../enums';
import { CourseSchema } from '../models';
import { zId, zInt, zText } from '../primitives';

export const CreateCourseSchema = z
  .object({
    name: zText('Informe o nome do curso'),
    duration: zInt('Informe a duração'),
    duration_type: DurationTypeSchema,
    category_id: zId('Informe a categoria'),
    old_id: z.string().optional(),
  })
  .strict()
  .meta({ id: 'CreateCourse' });

export const UpdateCourseSchema = CreateCourseSchema.omit({ old_id: true })
  .partial()
  .strict()
  .meta({ id: 'UpdateCourse' });

export const CourseResponseSchema = CourseSchema.meta({ id: 'CourseResponse' });

export const CourseEnvelopeSchema = apiEnvelope('course', CourseResponseSchema);
export const CourseListEnvelopeSchema = apiEnvelope('courses', z.array(CourseResponseSchema));
/** Listagens de apoio (selects) devolvem só `{ id, name }`. */
export const CourseNamedListEnvelopeSchema = apiEnvelope('courses', z.array(NamedEntitySchema));

// `CourseSummarySchema` (recorte embutido na bolsa) é exportado por `scholarships`.

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CourseResponse = z.infer<typeof CourseResponseSchema>;
export type CourseEnvelope = z.infer<typeof CourseEnvelopeSchema>;
export type CourseListEnvelope = z.infer<typeof CourseListEnvelopeSchema>;
