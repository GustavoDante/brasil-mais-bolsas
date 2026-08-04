"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da ligação"),
});

export type DeleteIndicationCallInput = z.infer<typeof schema>;

/**
 * `DELETE /v1/indications/call/:id` — Remove uma ligação de indicação (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteIndicationCall(
  input: DeleteIndicationCallInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Ligação removida.",
    revalidateTags: ["indications"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/indications/call/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
