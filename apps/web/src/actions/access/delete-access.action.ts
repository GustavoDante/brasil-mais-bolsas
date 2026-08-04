"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id do acesso"),
});

export type DeleteAccessInput = z.infer<typeof schema>;

/**
 * `DELETE /v1/access/:id` — Remove um acesso.
 *
 * Requer sessão autenticada.
 */
export async function deleteAccess(
  input: DeleteAccessInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Acesso removido.",
    revalidateTags: ["accesses"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/access/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
