import { z } from 'zod';

import { apiEnvelope } from '../common';
import { ExternalClientSchema } from '../models';
import { zId, zText } from '../primitives';

export const CreateExternalClientSchema = z
  .object({
    id: zId('Informe o id'),
    name: zText('Informe o nome'),
  })
  .strict()
  .meta({ id: 'CreateExternalClient' });

export const ExternalClientResponseSchema = ExternalClientSchema.meta({
  id: 'ExternalClientResponse',
});

export const ExternalClientEnvelopeSchema = apiEnvelope('client', ExternalClientResponseSchema);

export type CreateExternalClientInput = z.infer<typeof CreateExternalClientSchema>;
export type ExternalClientResponse = z.infer<typeof ExternalClientResponseSchema>;
