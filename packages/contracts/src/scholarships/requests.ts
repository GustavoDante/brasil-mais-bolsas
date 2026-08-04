import { z } from 'zod';

import { ScholarshipTypeSchema } from '../enums';
import {
  zAmount,
  zDateInput,
  zId,
  zInt,
  zOptionalAmount,
  zOptionalBoolean,
  zOptionalDateInput,
  zOptionalInt,
  zStringArray,
  zText,
} from '../primitives';

/**
 * Assimetria proposital entre entrada e saída de valores monetários: aqui os preços entram
 * como **number** (o service faz `new Prisma.Decimal(dto.full_price)`), mas saem como
 * **string** nas respostas, porque é assim que o Prisma serializa `Decimal` em JSON.
 * Ver `responses.ts`.
 */
const scholarshipWritableShape = {
  shift: zText('Informe o turno'),
  type: ScholarshipTypeSchema,
  full_price: zAmount('Informe o valor integral'),
  discount: zAmount('Informe o desconto'),
  quantity_offered: zInt('Informe a quantidade ofertada'),
  renovation_days: zInt('Informe os dias de renovação'),
  register_period_start: zDateInput(),
  register_period_end: zOptionalDateInput(),
  course_description: zText('Informe a descrição do curso'),
  course_id: zId('Informe o curso'),
  institution_id: zId('Informe a instituição'),
  course_period: zStringArray(),
  old_id: z.string().optional(),
  active: zOptionalBoolean(),
  delete: zOptionalBoolean(),
  expired: zOptionalBoolean(),
  is_yearly: zOptionalBoolean(),
  registration_fee: zOptionalAmount(),
  adhesion_fee: zOptionalAmount(),
  registration_fee_discount: zOptionalAmount(),
  installments: zOptionalInt(),
};

export const CreateScholarshipSchema = z
  .object({
    ...scholarshipWritableShape,
    /** Usado no fluxo de novo valor; opcional na criação comum. */
    scholarship_id: z.string().optional(),
  })
  .strict()
  .meta({ id: 'CreateScholarship' });

/** Substitui uma bolsa por outra com valor novo — aqui `scholarship_id` é obrigatório. */
export const CreateNewScholarshipValueSchema = CreateScholarshipSchema.extend({
  scholarship_id: zId('Informe a bolsa a ser substituída'),
})
  .strict()
  .meta({ id: 'CreateNewScholarshipValue' });

export const UpdateScholarshipSchema = z
  .object({
    shift: scholarshipWritableShape.shift,
    type: scholarshipWritableShape.type,
    full_price: scholarshipWritableShape.full_price,
    discount: scholarshipWritableShape.discount,
    quantity_offered: scholarshipWritableShape.quantity_offered,
    renovation_days: scholarshipWritableShape.renovation_days,
    register_period_start: zDateInput(),
    register_period_end: zDateInput(),
    course_description: scholarshipWritableShape.course_description,
    course_period: zStringArray(),
    is_yearly: zOptionalBoolean(),
    active: zOptionalBoolean(),
    registration_fee: zOptionalAmount(),
    adhesion_fee: zOptionalAmount(),
    registration_fee_discount: zOptionalAmount(),
    installments: zOptionalInt(),
  })
  .partial()
  .strict()
  .meta({ id: 'UpdateScholarship' });

export const ChangeScholarshipOrderSchema = z
  .object({
    order_id: zId('Informe o pedido'),
    new_scholarship: zId('Informe a nova bolsa'),
  })
  .strict()
  .meta({ id: 'ChangeScholarshipOrder' });

/**
 * Filtros da listagem pública. Todos chegam como string na query — `showExpired` e
 * `showInativas` continuam string porque é assim que o service os lê hoje.
 */
export const ScholarshipListQuerySchema = z
  .object({
    alreadyListed: zStringArray(),
    type: z.string().optional(),
    institution: z.string().optional(),
    city: z.string().optional(),
    category: z.string().optional(),
    course: z.string().optional(),
    showExpired: z.string().optional(),
    showInativas: z.string().optional(),
  })
  .meta({ id: 'ScholarshipListQuery' });

export type CreateScholarshipInput = z.infer<typeof CreateScholarshipSchema>;
export type CreateNewScholarshipValueInput = z.infer<typeof CreateNewScholarshipValueSchema>;
export type UpdateScholarshipInput = z.infer<typeof UpdateScholarshipSchema>;
export type ChangeScholarshipOrderInput = z.infer<typeof ChangeScholarshipOrderSchema>;
export type ScholarshipListQuery = z.infer<typeof ScholarshipListQuerySchema>;
