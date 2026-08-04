"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da ligação"),
});

export type DeleteCallInput = z.infer<typeof schema>;

/**
 * `DELETE /v1/calls/:id` — Remove uma ligação.
 *
 * Requer sessão autenticada.
 */
export async function deleteCall(
  input: DeleteCallInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Ligação removida.",
    revalidateTags: ["calls"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/calls/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
