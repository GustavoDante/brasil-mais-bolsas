import { z } from 'zod';

import { apiEnvelope } from '../common';
import { SignedContractSchema } from '../models';
import { zBoolean, zId, zText } from '../primitives';

export const CreateSignedContractSchema = z
  .object({
    ip: zText('Informe o IP'),
    isMobile: zBoolean(),
    user_id: zId('Informe o usuário'),
    scholarship_id: zId('Informe a bolsa'),
    deviceInfo: zText('Informe os dados do dispositivo'),
  })
  .strict()
  .meta({ id: 'CreateSignedContract' });

export const SignedContractResponseSchema = SignedContractSchema.meta({
  id: 'SignedContractResponse',
});

export const SignedContractEnvelopeSchema = apiEnvelope(
  'signedContract',
  SignedContractResponseSchema,
);
export const SignedContractListEnvelopeSchema = apiEnvelope(
  'signedContracts',
  z.array(SignedContractResponseSchema),
);

export type CreateSignedContractInput = z.infer<typeof CreateSignedContractSchema>;
export type SignedContractResponse = z.infer<typeof SignedContractResponseSchema>;
