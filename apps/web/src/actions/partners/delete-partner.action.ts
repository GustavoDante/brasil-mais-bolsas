"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id do parceiro"),
});

export type DeletePartnerInput = z.infer<typeof schema>;

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
    schema,
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
