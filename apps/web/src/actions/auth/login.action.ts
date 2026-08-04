"use server";

import { LoginSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AuthResponseDto } from "@/lib/api/dto";

const schema = LoginSchema;

export type LoginInput = z.infer<typeof schema>;

/**
 * `POST /v1/auth/login` — Autentica e devolve o token de acesso (a sessão é gravada por `signIn`).
 */
export async function login(
  input: LoginInput,
): Promise<ActionResult<AuthResponseDto>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ email, password }) =>
      apiRequest<AuthResponseDto>("/auth/login", {
        method: "POST",
        body: { email, password },
        revalidate: false,
      }),
  });
}
