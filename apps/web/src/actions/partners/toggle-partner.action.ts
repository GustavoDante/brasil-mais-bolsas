"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  togglePartnerInputSchema,
  type TogglePartnerInput,
} from "@/schemas/partners/toggle-partner.schema";

/**
 * `PATCH /v1/partners/:id/toggle` — Ativa/desativa um parceiro (admin).
 *
 * Requer sessão autenticada.
 */
export async function togglePartner(
  input: TogglePartnerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: togglePartnerInputSchema,
    auth: "required",
    successMessage: "Parceiro atualizado.",
    revalidateTags: ["partners"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/partners/${encodeURIComponent(id)}/toggle`,
        { method: "PATCH", token },
      ).then(() => null),
  });
}
