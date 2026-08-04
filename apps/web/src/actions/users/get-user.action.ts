"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";
import {
  getUserInputSchema,
  type GetUserInput,
} from "@/schemas/users/get-user.schema";

/**
 * `GET /v1/users/:id` — Busca um usuário pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getUser(
  input: GetUserInput,
): Promise<ActionResult<UserDto>> {
  return executeAction({
    input,
    schema: getUserInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<UserDto>(`/users/${encodeURIComponent(id)}`, {
        token,
        revalidate: false,
      }),
  });
}
