"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da instituição"),
});

export type DeleteInstitutionInput = z.infer<typeof schema>;

/**
 * `DELETE /v1/institutions/:id` — Remove uma instituição (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteInstitution(
  input: DeleteInstitutionInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Instituição removida.",
    revalidateTags: ["institutions"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/institutions/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
