"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do usuário"),
});

export type GetUserInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<UserDto>(`/users/${encodeURIComponent(id)}`, {
        token,
        revalidate: false,
      }),
  });
}
