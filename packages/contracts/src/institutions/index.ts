import { z } from 'zod';

import { apiEnvelope, NamedEntitySchema } from '../common';
import { InstitutionSchema, SellerSchema } from '../models';
import {
  zDateString,
  zEmail,
  zId,
  zQueryInt,
  zQueryOptionalBoolean,
  zState,
  zText,
} from '../primitives';

export const CreateInstitutionSchema = z
  .object({
    name: zText('Informe o nome da instituição'),
    description: zText('Informe a descrição'),
    /** Opcional na entrada: pode vir do upload multipart em vez do corpo JSON. */
    image: z.string().optional(),
    cnpj: zText('Informe o CNPJ'),
    email: zEmail().optional(),
    email_2: zEmail().optional(),
    phone: zText('Informe o telefone'),
    phone_2: z.string().optional(),
    phone_3: z.string().optional(),
    owner_name: zText('Informe o nome do responsável'),
    owner_phone: z.string().optional(),
    owner_secondary_phone: z.string().optional(),
    owner_birthdate: zDateString().optional(),
    operator_name: zText('Informe o nome do operador'),
    operator_phone: z.string().optional(),
    operator_birthdate: zDateString().optional(),
    operator_2_name: z.string().optional(),
    operator_2_phone: z.string().optional(),
    operator_2_birthdate: zDateString().optional(),
    street: zText('Informe a rua'),
    number: zText('Informe o número'),
    district: zText('Informe o bairro'),
    city: zText('Informe a cidade'),
    state: zState(),
    postal_code: zText('Informe o CEP'),
    // Esta rota aceita `application/json` **e** `multipart/form-data` (a logo sobe junto).
    // Em multipart todo campo chega como string, então número e booleano precisam de
    // coerção explícita — sem ela, o cadastro com logo passa a devolver 400.
    students_count: zQueryInt({ min: 0 }),
    observations: z.string().optional(),
    old_id: z.string().optional(),
    fake: zQueryOptionalBoolean(),
    seller_id: zId('Informe o vendedor'),
  })
  .strict()
  .meta({ id: 'CreateInstitution' });

export const UpdateInstitutionSchema = CreateInstitutionSchema.partial()
  .strict()
  .meta({ id: 'UpdateInstitution' });

export const InstitutionSellerSchema = SellerSchema.pick({
  id: true,
  name: true,
  email: true,
}).meta({ id: 'InstitutionSeller' });

export const InstitutionResponseSchema = InstitutionSchema.extend({
  seller: InstitutionSellerSchema.nullish(),
}).meta({ id: 'InstitutionResponse' });

export const InstitutionEnvelopeSchema = apiEnvelope('institution', InstitutionResponseSchema);
export const InstitutionListEnvelopeSchema = apiEnvelope(
  'institutions',
  z.array(InstitutionResponseSchema),
);
/** Busca de apoio (autocomplete) devolve só `{ id, name }`. */
export const InstitutionNamedListEnvelopeSchema = apiEnvelope(
  'institutions',
  z.array(NamedEntitySchema),
);

// `InstitutionSummarySchema` (recorte embutido na bolsa) é exportado por `scholarships`.

export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof UpdateInstitutionSchema>;
export type InstitutionResponse = z.infer<typeof InstitutionResponseSchema>;
export type InstitutionEnvelope = z.infer<typeof InstitutionEnvelopeSchema>;
export type InstitutionListEnvelope = z.infer<typeof InstitutionListEnvelopeSchema>;
