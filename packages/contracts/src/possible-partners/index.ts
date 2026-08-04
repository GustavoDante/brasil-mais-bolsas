import { z } from 'zod';

import { apiEnvelope } from '../common';
import { PossiblePartnerCallSchema, PossiblePartnerSchema } from '../models';
import { zEmail, zId, zOptionalBoolean, zText } from '../primitives';

export const CreatePossiblePartnerSchema = z
  .object({
    institutionName: z.string().optional(),
    cnpj: z.string().optional(),
    modality: z.string().optional(),
    name: zText('Informe o nome'),
    email: zEmail(),
    message: z.string().optional(),
    cell: zText('Informe o celular'),
    city: z.string().optional(),
    numStudents: z.string().optional(),
  })
  .strict()
  .meta({ id: 'CreatePossiblePartner' });

export const CreatePossiblePartnerCallSchema = z
  .object({
    possible_partner_id: zId('Informe o possível parceiro'),
    receiver_id: z.string().optional(),
    description: zText('Informe a descrição'),
    to_return: zOptionalBoolean(),
  })
  .strict()
  .meta({ id: 'CreatePossiblePartnerCall' });

export const PossiblePartnerResponseSchema = PossiblePartnerSchema.meta({
  id: 'PossiblePartnerResponse',
});
export const PossiblePartnerCallResponseSchema = PossiblePartnerCallSchema.meta({
  id: 'PossiblePartnerCallResponse',
});

export const PossiblePartnerEnvelopeSchema = apiEnvelope(
  'possiblePartner',
  PossiblePartnerResponseSchema,
);
export const PossiblePartnerListEnvelopeSchema = apiEnvelope(
  'possiblePartners',
  z.array(PossiblePartnerResponseSchema),
);

export type CreatePossiblePartnerInput = z.infer<typeof CreatePossiblePartnerSchema>;
export type CreatePossiblePartnerCallInput = z.infer<typeof CreatePossiblePartnerCallSchema>;
export type PossiblePartnerResponse = z.infer<typeof PossiblePartnerResponseSchema>;
