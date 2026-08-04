import { z } from 'zod';

import { apiEnvelope } from '../common';
import { MinorSchema } from '../models';
import { zDateString, zId, zText } from '../primitives';

export const CreateMinorSchema = z
  .object({
    user_id: zId('Informe o usuário'),
    name: zText('Informe o nome'),
    birthdate: zDateString(),
  })
  .strict()
  .meta({ id: 'CreateMinor' });

/** `MinorResponseSchema` (mesma entidade, embutida no usuário) vive em `users/responses`. */
export const MinorEntitySchema = MinorSchema.meta({ id: 'MinorEntity' });

export const MinorEnvelopeSchema = apiEnvelope('minor', MinorEntitySchema);
export const MinorListEnvelopeSchema = apiEnvelope('minors', z.array(MinorEntitySchema));

export type CreateMinorInput = z.infer<typeof CreateMinorSchema>;
