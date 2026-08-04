"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteInstitutionInputSchema,
  type DeleteInstitutionInput,
} from "@/schemas/institutions/delete-institution.schema";

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
    schema: deleteInstitutionInputSchema,
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
