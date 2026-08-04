import { z } from 'zod';

import { zEmail, zPassword, zStrongPassword, zText } from '../primitives';

export const LoginSchema = z
  .object({
    email: zEmail(),
    password: zPassword('Senha deve ter no mínimo 6 caracteres'),
  })
  .strict()
  .meta({ id: 'Login' });

export const ForgotPasswordSchema = z
  .object({
    email: zEmail(),
  })
  .strict()
  .meta({
    id: 'ForgotPassword',
    description: 'Solicita o e-mail de redefinição. A resposta é sempre a mesma, exista ou não a conta.',
  });

export const ResetPasswordSchema = z
  .object({
    token: zText('Token inválido', { min: 32, max: 128 }),
    password: zStrongPassword(),
    repassword: zStrongPassword(),
  })
  .strict()
  .refine((data) => data.password === data.repassword, {
    error: 'As senhas não conferem',
    path: ['repassword'],
  })
  .meta({ id: 'ResetPassword' });

export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/** `POST /v1/auth/register` — o schema mora em `users` porque a entidade é o usuário. */
export { RegisterSchema, type RegisterInput } from '../users/requests';
