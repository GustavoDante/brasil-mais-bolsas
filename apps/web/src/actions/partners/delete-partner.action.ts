"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deletePartnerInputSchema,
  type DeletePartnerInput,
} from "@/schemas/partners/delete-partner.schema";

/**
 * `DELETE /v1/partners/:id` — Remove um parceiro (admin).
 *
 * Requer sessão autenticada.
 */
export async function deletePartner(
  input: DeletePartnerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deletePartnerInputSchema,
    auth: "required",
    successMessage: "Parceiro removido.",
    revalidateTags: ["partners"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/partners/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
