import { z } from 'zod';

import { apiEnvelope } from '../common';
import { AccessSchema, PartnerSchema } from '../models';
import { zId, zPassword, zText } from '../primitives';

export const CreatePartnerSchema = z
  .object({
    name: zText('Informe o nome'),
    code: zText('Informe o código'),
    password: zPassword(),
  })
  .strict()
  .meta({ id: 'CreatePartner' });

export const UpdatePartnerSchema = CreatePartnerSchema.partial()
  .strict()
  .meta({ id: 'UpdatePartner' });

export const PartnerLoginSchema = z
  .object({
    code: zText('Informe o código'),
    password: zText('Informe a senha'),
  })
  .strict()
  .meta({ id: 'PartnerLogin' });

/** Recorte por período. O formato é `MM-DD-YYYY`, herdado do sistema antigo. */
export const PartnersQuerySchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .meta({ id: 'PartnersQuery' });

/** Registra o acesso vindo de um link de parceiro. */
export const RegisterAccessSchema = z
  .object({
    partner_code: zText('Informe o código do parceiro'),
  })
  .strict()
  .meta({ id: 'RegisterAccess' });

export const CreateAccessSchema = z
  .object({
    partner_id: zId('Informe o parceiro'),
  })
  .strict()
  .meta({ id: 'CreateAccess' });

/** A senha nunca sai da API. */
export const PartnerResponseSchema = PartnerSchema.omit({ password: true })
  .extend({
    /** Presentes nas listagens do backoffice. */
    accesses_count: z.number().int().optional(),
    users_count: z.number().int().optional(),
  })
  .meta({ id: 'PartnerResponse' });

export const AccessResponseSchema = AccessSchema.meta({ id: 'AccessResponse' });

export const PartnerEnvelopeSchema = apiEnvelope('partner', PartnerResponseSchema);
export const PartnerListEnvelopeSchema = apiEnvelope('partners', z.array(PartnerResponseSchema));

export type CreatePartnerInput = z.infer<typeof CreatePartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof UpdatePartnerSchema>;
export type PartnerLoginInput = z.infer<typeof PartnerLoginSchema>;
export type PartnersQuery = z.infer<typeof PartnersQuerySchema>;
export type RegisterAccessInput = z.infer<typeof RegisterAccessSchema>;
export type CreateAccessInput = z.infer<typeof CreateAccessSchema>;
export type PartnerResponse = z.infer<typeof PartnerResponseSchema>;
export type AccessResponse = z.infer<typeof AccessResponseSchema>;
