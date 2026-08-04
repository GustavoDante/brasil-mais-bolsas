"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deletePossiblePartnerCallInputSchema,
  type DeletePossiblePartnerCallInput,
} from "@/schemas/possible-partners/delete-possible-partner-call.schema";

/**
 * `DELETE /v1/possible-partners/call/:id` — Remove uma ligação de possível parceiro (admin).
 *
 * Requer sessão autenticada.
 */
export async function deletePossiblePartnerCall(
  input: DeletePossiblePartnerCallInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deletePossiblePartnerCallInputSchema,
    auth: "required",
    successMessage: "Ligação removida.",
    revalidateTags: ["possible-partners"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/possible-partners/call/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
