"use server";

import { z } from "zod";
import {
  executeAction,
  formDataToObject,
  zEmail,
  zPassword,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AuthResponseDto, UserSafeDto } from "@/lib/api/dto";
import { clearSessionToken, setSessionToken } from "@/lib/api/session";

const schema = z.object({
  email: zEmail(),
  // A API aceita a senha ou o CPF (somente dígitos) do aluno.
  password: zPassword("Informe a senha ou o CPF"),
});

export type SignInInput = z.infer<typeof schema>;

/**
 * `POST /v1/auth/login` — autentica e **grava a sessão** no cookie httpOnly.
 *
 * Diferença para `login`: aquela apenas devolve o token (útil em fluxos server-to-server);
 * esta é a que a interface deve usar, porque persiste a sessão.
 */
export async function signIn(
  input: SignInInput,
): Promise<ActionResult<UserSafeDto>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    successMessage: "Login realizado.",
    run: async ({ email, password }) => {
      const response = await apiRequest<AuthResponseDto>("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      await setSessionToken(response.accessToken);
      return response.user;
    },
  });
}

/** Adaptador para `useActionState` — recebe o `FormData` do `<form action={...}>`. */
export async function signInForm(
  _previous: ActionResult<UserSafeDto | null>,
  formData: FormData,
): Promise<ActionResult<UserSafeDto>> {
  return signIn(formDataToObject(formData) as SignInInput);
}

/** Encerra a sessão apagando o cookie. */
export async function signOut(): Promise<ActionResult<null>> {
  await clearSessionToken();
  return { ok: true, data: null, message: "Sessão encerrada." };
}
