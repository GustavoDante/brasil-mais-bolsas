import { z } from 'zod';

import { UserSafeSchema } from '../users/responses';

export const AuthResponseSchema = z
  .object({
    accessToken: z.string(),
    user: UserSafeSchema,
  })
  .meta({ id: 'AuthResponse' });

/**
 * `GET /v1/auth/me` — o que o `JwtStrategy` põe em `req.user`.
 *
 * `type` fica `z.string()`, e não `UserTypeSchema`: resposta não é validada em runtime em
 * lugar nenhum, então apertar aqui só faria o compilador prometer um conjunto fechado que
 * uma linha legada pode não respeitar. Quem consome estreita uma vez, explicitamente.
 *
 * `institution_id` é a chave de escopo do gestor — é por ela que o web sabe de qual
 * instituição é o painel. `.nullish()` porque a API responde `null` para admin e aluno, e
 * um web mais novo que a API simplesmente não vê a chave.
 */
export const AuthProfileSchema = z
  .object({
    userId: z.string(),
    email: z.string(),
    type: z.string(),
    institution_id: z.string().nullish(),
  })
  .meta({ id: 'AuthProfile' });

export const ForgotPasswordResponseSchema = z
  .object({
    ok: z.boolean(),
    message: z.string(),
  })
  .meta({ id: 'ForgotPasswordResponse' });

export const ResetPasswordResponseSchema = ForgotPasswordResponseSchema.meta({
  id: 'ResetPasswordResponse',
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type AuthProfile = z.infer<typeof AuthProfileSchema>;
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
