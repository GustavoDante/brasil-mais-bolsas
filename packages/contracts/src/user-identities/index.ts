import { z } from 'zod';

import { apiEnvelope } from '../common';
import { UserIdentitySchema } from '../models';
import { zId, zText } from '../primitives';

export const CreateUserIdentitySchema = z
  .object({
    provider: zText('Informe o provedor'),
    provider_account_id: zText('Informe o id da conta no provedor'),
    user_id: zId('Informe o usuário'),
  })
  .strict()
  .meta({ id: 'CreateUserIdentity' });

export const UserIdentityResponseSchema = UserIdentitySchema.meta({ id: 'UserIdentityResponse' });

export const UserIdentityEnvelopeSchema = apiEnvelope('identity', UserIdentityResponseSchema);
export const UserIdentityListEnvelopeSchema = apiEnvelope(
  'identities',
  z.array(UserIdentityResponseSchema),
);

export type CreateUserIdentityInput = z.infer<typeof CreateUserIdentitySchema>;
export type UserIdentityResponse = z.infer<typeof UserIdentityResponseSchema>;
