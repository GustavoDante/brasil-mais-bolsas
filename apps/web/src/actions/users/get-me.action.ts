"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";
import { getMeInputSchema } from "@/schemas/users/get-me.schema";

/**
 * `GET /v1/users/me` — Dados completos do usuário autenticado.
 *
 * Requer sessão autenticada.
 */
export async function getMe(): Promise<ActionResult<UserDto>> {
  return executeAction({
    input: {},
    schema: getMeInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<UserDto>("/users/me", { token, revalidate: false })
  });
}
