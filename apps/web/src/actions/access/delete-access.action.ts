"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteAccessInputSchema,
  type DeleteAccessInput,
} from "@/schemas/access/delete-access.schema";

/**
 * `DELETE /v1/access/:id` — Remove um acesso.
 *
 * Requer sessão autenticada.
 */
export async function deleteAccess(
  input: DeleteAccessInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteAccessInputSchema,
    auth: "required",
    successMessage: "Acesso removido.",
    revalidateTags: ["accesses"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/access/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
