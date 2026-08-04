import { z } from 'zod';

import { apiEnvelope } from '../common';
import { AddressSchema } from '../models';
import { zId, zText } from '../primitives';

/**
 * Endereço criado avulso (`POST /v1/addresses`), com `user_id` explícito.
 * O endereço enviado junto do cadastro de usuário é o `CreateAddressSchema` de `users`.
 */
export const CreateAddressStandaloneSchema = z
  .object({
    user_id: zId('Informe o usuário'),
    street: zText('Informe a rua'),
    city: zText('Informe a cidade'),
    state: zText('Informe o estado'),
    number: zText('Informe o número'),
    district: zText('Informe o bairro'),
    postal_code: zText('Informe o CEP'),
  })
  .strict()
  .meta({ id: 'CreateAddressStandalone' });

export const AddressEntitySchema = AddressSchema.meta({ id: 'AddressEntity' });

export const AddressEnvelopeSchema = apiEnvelope('address', AddressEntitySchema);

export type CreateAddressStandaloneInput = z.infer<typeof CreateAddressStandaloneSchema>;
export type AddressEntity = z.infer<typeof AddressEntitySchema>;
