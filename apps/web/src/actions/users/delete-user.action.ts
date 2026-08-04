"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id do usuário"),
});

export type DeleteUserInput = z.infer<typeof schema>;

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
    schema,
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
