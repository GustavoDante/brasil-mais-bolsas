import { z } from 'zod';

import { apiEnvelope } from '../common';
import { AddressSchema, MinorSchema, UserSchema } from '../models';

/**
 * Usuário como a API devolve: o model do banco **menos** os campos secretos.
 *
 * O `.omit()` é o ponto: acrescentar um campo sensível no `schema.prisma` sem incluí-lo
 * aqui faria o campo vazar na resposta. Manter a lista de exclusão explícita transforma
 * isso numa decisão consciente.
 */
export const UserSafeSchema = UserSchema.omit({
  password: true,
  reset_password_token: true,
  reset_password_expires: true,
}).meta({ id: 'UserSafe' });

export const AddressResponseSchema = AddressSchema.omit({
  user_id: true,
  created_at: true,
  updated_at: true,
}).meta({ id: 'AddressResponse' });

export const MinorResponseSchema = MinorSchema.meta({ id: 'MinorResponse' });

/** Usuário com os relacionamentos que a API inclui quando pedidos. */
export const UserResponseSchema = UserSafeSchema.extend({
  address: AddressResponseSchema.nullish(),
  minors: z.array(MinorResponseSchema).optional(),
}).meta({ id: 'UserResponse' });

export const UserEnvelopeSchema = apiEnvelope('user', UserResponseSchema);
export const UserListEnvelopeSchema = apiEnvelope('users', z.array(UserResponseSchema));

export type UserSafe = z.infer<typeof UserSafeSchema>;
export type AddressResponse = z.infer<typeof AddressResponseSchema>;
export type MinorResponse = z.infer<typeof MinorResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserEnvelope = z.infer<typeof UserEnvelopeSchema>;
export type UserListEnvelope = z.infer<typeof UserListEnvelopeSchema>;
