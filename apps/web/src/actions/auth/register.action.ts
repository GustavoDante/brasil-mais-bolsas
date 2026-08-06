"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AuthResponseDto, UserSafeDto } from "@/lib/api/dto";
import { setSessionToken } from "@/lib/api/session";
import {
  registerInputSchema,
  type RegisterInput,
} from "@/schemas/auth/register.schema";

/**
 * `POST /v1/auth/register` — cadastro público de aluno.
 *
 * A API já devolve o token junto do cadastro, então a sessão é gravada aqui mesmo: o
 * aluno entra logado, sem passar pela tela de login. A senha inicial é o CPF (só
 * números) e é definida no servidor — por isso o payload não tem campo de senha.
 */
export async function register(
  input: RegisterInput,
): Promise<ActionResult<UserSafeDto>> {
  return executeAction({
    input,
    schema: registerInputSchema,
    auth: "none",
    successMessage: "Cadastro realizado.",
    run: async (data) => {
      const response = await apiRequest<AuthResponseDto>("/auth/register", {
        method: "POST",
        body: data,
      });

      await setSessionToken(response.accessToken);
      return response.user;
    },
  });
}
