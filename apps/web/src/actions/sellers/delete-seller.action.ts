"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id do vendedor"),
});

export type DeleteSellerInput = z.infer<typeof schema>;

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
    schema,
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
