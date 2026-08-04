"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da ligação"),
});

export type DeletePossiblePartnerCallInput = z.infer<typeof schema>;

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
    schema,
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
