"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteUserInputSchema,
  type DeleteUserInput,
} from "@/schemas/users/delete-user.schema";

/**
 * `DELETE /v1/users/:id` — Remove um usuário (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteUser(
  input: DeleteUserInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteUserInputSchema,
    auth: "required",
    successMessage: "Usuário removido.",
    revalidateTags: ["users"],
    run: ({ id }, { token }) =>
      apiRequest<{ message: string }>(`/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
        token,
      }).then(() => null),
  });
}
