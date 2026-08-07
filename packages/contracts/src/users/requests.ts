import { z } from 'zod';

import { AddressSchema, UserSchema } from '../models';
import {
  zCpf,
  zDateString,
  zEmail,
  zNumericString,
  zOptionalBoolean,
  zPassword,
  zState,
  zText,
} from '../primitives';
import { UserTypeSchema } from '../user-types';

/**
 * Endereço enviado junto com o usuário.
 *
 * Derivado do model: os nomes e a obrigatoriedade vêm do banco (`.pick()`), e só o que é
 * regra de entrada é sobrescrito — UF normalizada em 2 letras, `complement` opcional e o
 * mínimo de um caractere nos demais. Esse mínimo não é redundante: `NOT NULL` no banco vira
 * `z.string()` no schema gerado, que aceita `""` — ou seja, sem ele um formulário com os
 * campos de endereço em branco passava pela validação e o endereço chegava vazio ao
 * cadastro e ao gateway de pagamento.
 */
export const CreateAddressSchema = AddressSchema.pick({
  street: true,
  city: true,
  number: true,
  district: true,
  postal_code: true,
})
  .extend({
    street: zText('Informe a rua'),
    city: zText('Informe a cidade'),
    number: zText('Informe o número'),
    district: zText('Informe o bairro'),
    postal_code: zText('Informe o CEP', { min: 8 }),
    state: zState(),
    complement: z.string().optional(),
  })
  .strict()
  .meta({ id: 'CreateAddress', description: 'Endereço do usuário' });

export const UpdateAddressSchema = CreateAddressSchema.partial()
  .strict()
  .meta({ id: 'UpdateAddress' });

/** Campos que usuário e cadastro público compartilham. */
const userBaseShape = {
  name: zText('Informe o nome', { min: 3 }),
  email: zEmail(),
  phone: zText('Informe o telefone'),
  birthdate: zDateString(),
  cpf: zCpf(),
  rg: zText('Informe o RG'),
  rg_emissor: zText('Informe o órgão emissor'),
  secondary_phone: z.string().optional(),
  whatsapp_phone: z.string().optional(),
  friend_phone: z.string().optional(),
  /** Trafega como string para não perder precisão do `Decimal`. */
  family_income: zNumericString().optional(),
  ccp: z.string().optional(),
};

export const CreateUserSchema = z
  .object({
    ...userBaseShape,
    type: UserTypeSchema.optional(),
    observations: z.string().max(2000).optional(),
    partner_id: z.string().optional(),
    institution_id: z.string().optional(),
    address: CreateAddressSchema,
  })
  .strict()
  .meta({ id: 'CreateUser' });

export const UpdateUserSchema = z
  .object({
    ...userBaseShape,
    observations: z.string().max(2000).optional(),
    password: zPassword().optional(),
    address: UpdateAddressSchema.optional(),
  })
  .partial()
  .strict()
  .meta({ id: 'UpdateUser' });

/** Só admin muda `type` e `active` — por isso é um schema à parte, não um campo opcional. */
export const AdminUpdateUserSchema = UpdateUserSchema.extend({
  type: UserTypeSchema.optional(),
  active: zOptionalBoolean(),
})
  .strict()
  .meta({ id: 'AdminUpdateUser' });

/**
 * Cadastro público de aluno (`POST /v1/auth/register`).
 *
 * Deliberadamente **não** aceita `type`, `institution_id` nem `partner_id`: quem entra pela
 * rota pública é sempre `user`. O vínculo com parceiro entra por `partner_code` e é
 * resolvido no servidor. Manter esses campos fora do schema é o que impede escalada de
 * privilégio por payload.
 */
export const RegisterSchema = z
  .object({
    ...userBaseShape,
    register_scholarship: z.string().optional(),
    partner_code: z.string().optional(),
    address: CreateAddressSchema,
  })
  .strict()
  .meta({ id: 'Register', description: 'Cadastro público de aluno' });

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof AdminUpdateUserSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

/** Campos que nunca saem da API. Fonte única para montar as respostas de usuário. */
export const USER_PRIVATE_FIELDS = [
  'password',
  'reset_password_token',
  'reset_password_expires',
] as const satisfies readonly (keyof z.infer<typeof UserSchema>)[];
