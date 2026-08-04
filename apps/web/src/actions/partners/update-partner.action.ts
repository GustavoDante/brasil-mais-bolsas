"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  updatePartnerInputSchema,
  type UpdatePartnerInput,
} from "@/schemas/partners/update-partner.schema";

/**
 * `PUT /v1/partners/:id` — Atualiza um parceiro (admin).
 *
 * Requer sessão autenticada.
 */
export async function updatePartner(
  input: UpdatePartnerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: updatePartnerInputSchema,
    auth: "required",
    successMessage: "Parceiro atualizado.",
    revalidateTags: ["partners"],
    run: ({ id, name, code, password }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/partners/${encodeURIComponent(id)}`,
        { method: "PUT", body: { name, code, password }, token },
      ).then(() => null),
  });
}
