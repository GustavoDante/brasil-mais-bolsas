"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ApiOkResponse } from "@/lib/api/dto";
import {
  resetPasswordInputSchema,
  type ResetPasswordInput,
} from "@/schemas/auth/reset-password.schema";

/**
 * `POST /v1/auth/password_reset` — conclui a recuperação com o token recebido por e-mail.
 *
 * O token é de uso único e expira (24h por padrão); a senha nova não é gravada em
 * sessão — o usuário entra normalmente pela tela de login depois.
 */
export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: resetPasswordInputSchema,
    auth: "none",
    successMessage: "Senha atualizada. Faça login com a nova senha.",
    run: async (data) => {
      await apiRequest<ApiOkResponse>("/auth/password_reset", {
        method: "POST",
        body: data,
      });

      return null;
    },
  });
}
