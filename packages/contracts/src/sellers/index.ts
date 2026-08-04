import { z } from 'zod';

import { apiEnvelope } from '../common';
import { SellerSchema } from '../models';
import { zEmail, zPassword, zText } from '../primitives';

export const CreateSellerSchema = z
  .object({
    name: zText('Informe o nome'),
    email: zEmail(),
    password: zPassword(),
  })
  .strict()
  .meta({ id: 'CreateSeller' });

export const UpdateSellerSchema = CreateSellerSchema.partial()
  .strict()
  .meta({ id: 'UpdateSeller' });

export const SellerLoginSchema = z
  .object({
    email: zEmail(),
    password: z.string(),
  })
  .strict()
  .meta({ id: 'SellerLogin' });

/** Recorte por período. O formato é `MM-DD-YYYY`, herdado do sistema antigo. */
export const SellersQuerySchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .meta({ id: 'SellersQuery' });

/** A senha nunca sai da API. */
export const SellerResponseSchema = SellerSchema.omit({ password: true }).meta({
  id: 'SellerResponse',
});

export const SellerEnvelopeSchema = apiEnvelope('seller', SellerResponseSchema);
export const SellerListEnvelopeSchema = apiEnvelope('sellers', z.array(SellerResponseSchema));

export type CreateSellerInput = z.infer<typeof CreateSellerSchema>;
export type UpdateSellerInput = z.infer<typeof UpdateSellerSchema>;
export type SellerLoginInput = z.infer<typeof SellerLoginSchema>;
export type SellersQuery = z.infer<typeof SellersQuerySchema>;
export type SellerResponse = z.infer<typeof SellerResponseSchema>;
