import { z } from 'zod';

import { apiEnvelope } from '../common';
import { CallSchema } from '../models';
import { zId, zOptionalBoolean, zText } from '../primitives';

export const CreateCallSchema = z
  .object({
    receiver_id: zId('Informe o destinatário'),
    description: zText('Informe a descrição'),
    to_return: zOptionalBoolean(),
  })
  .strict()
  .meta({ id: 'CreateCall' });

export const UpdateCallSchema = CreateCallSchema.partial().strict().meta({ id: 'UpdateCall' });

export const CallResponseSchema = CallSchema.meta({ id: 'CallResponse' });

export const CallEnvelopeSchema = apiEnvelope('call', CallResponseSchema);
export const CallListEnvelopeSchema = apiEnvelope('calls', z.array(CallResponseSchema));

export type CreateCallInput = z.infer<typeof CreateCallSchema>;
export type UpdateCallInput = z.infer<typeof UpdateCallSchema>;
export type CallResponse = z.infer<typeof CallResponseSchema>;
