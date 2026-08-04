"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id do vendedor"),
});

export type ToggleSellerInput = z.infer<typeof schema>;

/**
 * `PATCH /v1/sellers/:id/toggle` — Ativa/desativa um vendedor (admin).
 *
 * Requer sessão autenticada.
 */
export async function toggleSeller(
  input: ToggleSellerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Vendedor atualizado.",
    revalidateTags: ["sellers"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/sellers/${encodeURIComponent(id)}/toggle`,
        { method: "PATCH", token },
      ).then(() => null),
  });
}
