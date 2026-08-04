"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteIndicationCallInputSchema,
  type DeleteIndicationCallInput,
} from "@/schemas/indications/delete-indication-call.schema";

/**
 * `DELETE /v1/indications/call/:id` — Remove uma ligação de indicação (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteIndicationCall(
  input: DeleteIndicationCallInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteIndicationCallInputSchema,
    auth: "required",
    successMessage: "Ligação removida.",
    revalidateTags: ["indications"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/indications/call/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
