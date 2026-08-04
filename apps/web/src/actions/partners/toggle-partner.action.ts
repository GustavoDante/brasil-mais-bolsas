"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id do parceiro"),
});

export type TogglePartnerInput = z.infer<typeof schema>;

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
    schema,
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
