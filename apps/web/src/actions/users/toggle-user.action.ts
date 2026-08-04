"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do usuário"),
});

export type ToggleUserInput = z.infer<typeof schema>;

/**
 * `PATCH /v1/users/:id/toggle` — Ativa/desativa um usuário (admin).
 *
 * Requer sessão autenticada.
 */
export async function toggleUser(
  input: ToggleUserInput,
): Promise<ActionResult<UserDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Usuário atualizado.",
    revalidateTags: ["users"],
    run: ({ id }, { token }) =>
      apiRequest<UserDto>(`/users/${encodeURIComponent(id)}/toggle`, {
        method: "PATCH",
        token,
      }),
  });
}
