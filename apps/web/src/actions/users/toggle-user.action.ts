"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";
import {
  toggleUserInputSchema,
  type ToggleUserInput,
} from "@/schemas/users/toggle-user.schema";

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
    schema: toggleUserInputSchema,
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
