"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteCallInputSchema,
  type DeleteCallInput,
} from "@/schemas/calls/delete-call.schema";

/**
 * `DELETE /v1/calls/:id` — Remove uma ligação.
 *
 * Requer sessão autenticada.
 */
export async function deleteCall(
  input: DeleteCallInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteCallInputSchema,
    auth: "required",
    successMessage: "Ligação removida.",
    revalidateTags: ["calls"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/calls/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
