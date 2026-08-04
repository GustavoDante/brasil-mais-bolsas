import { z } from 'zod';

import { UserSafeSchema } from '../users/responses';

export const AuthResponseSchema = z
  .object({
    accessToken: z.string(),
    user: UserSafeSchema,
  })
  .meta({ id: 'AuthResponse' });

/** `GET /v1/auth/me` — o que o `JwtStrategy` põe em `req.user`. */
export const AuthProfileSchema = z
  .object({
    userId: z.string(),
    email: z.string(),
    type: z.string(),
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
