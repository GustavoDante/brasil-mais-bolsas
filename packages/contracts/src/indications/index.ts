import { z } from 'zod';

import { apiEnvelope } from '../common';
import { IndicationCallSchema, IndicationSchema } from '../models';
import { zEmail, zId, zOptionalBoolean, zText } from '../primitives';

export const CreateIndicationSchema = z
  .object({
    name: zText('Informe o nome'),
    email: zEmail(),
    cell: zText('Informe o celular'),
    city: zText('Informe a cidade'),
  })
  .strict()
  .meta({ id: 'CreateIndication' });

export const UpdateIndicationSchema = CreateIndicationSchema.partial()
  .strict()
  .meta({ id: 'UpdateIndication' });

export const CreateIndicationCallSchema = z
  .object({
    indication_id: zId('Informe a indicação'),
    receiver_id: z.string().optional(),
    description: zText('Informe a descrição'),
    to_return: zOptionalBoolean(),
  })
  .strict()
  .meta({ id: 'CreateIndicationCall' });

export const IndicationResponseSchema = IndicationSchema.meta({ id: 'IndicationResponse' });
export const IndicationCallResponseSchema = IndicationCallSchema.meta({
  id: 'IndicationCallResponse',
});

export const IndicationEnvelopeSchema = apiEnvelope('indication', IndicationResponseSchema);
export const IndicationListEnvelopeSchema = apiEnvelope(
  'indications',
  z.array(IndicationResponseSchema),
);

export type CreateIndicationInput = z.infer<typeof CreateIndicationSchema>;
export type UpdateIndicationInput = z.infer<typeof UpdateIndicationSchema>;
export type CreateIndicationCallInput = z.infer<typeof CreateIndicationCallSchema>;
export type IndicationResponse = z.infer<typeof IndicationResponseSchema>;
