"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteSellerInputSchema,
  type DeleteSellerInput,
} from "@/schemas/sellers/delete-seller.schema";

/**
 * `DELETE /v1/sellers/:id` — Remove um vendedor (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteSeller(
  input: DeleteSellerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteSellerInputSchema,
    auth: "required",
    successMessage: "Vendedor removido.",
    revalidateTags: ["sellers"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/sellers/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
