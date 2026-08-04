"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  updateSellerInputSchema,
  type UpdateSellerInput,
} from "@/schemas/sellers/update-seller.schema";

/**
 * `PUT /v1/sellers/:id` — Atualiza um vendedor (admin).
 *
 * Requer sessão autenticada.
 */
export async function updateSeller(
  input: UpdateSellerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: updateSellerInputSchema,
    auth: "required",
    successMessage: "Vendedor atualizado.",
    revalidateTags: ["sellers"],
    run: ({ id, name, email, password }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/sellers/${encodeURIComponent(id)}`,
        { method: "PUT", body: { name, email, password }, token },
      ).then(() => null),
  });
}
