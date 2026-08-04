"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  toggleInstitutionInputSchema,
  type ToggleInstitutionInput,
} from "@/schemas/institutions/toggle-institution.schema";

/**
 * `PATCH /v1/institutions/:id/toggle` — Ativa/desativa uma instituição (admin).
 *
 * Requer sessão autenticada.
 */
export async function toggleInstitution(
  input: ToggleInstitutionInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: toggleInstitutionInputSchema,
    auth: "required",
    successMessage: "Instituição atualizada.",
    revalidateTags: ["institutions"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/institutions/${encodeURIComponent(id)}/toggle`,
        { method: "PATCH", token },
      ).then(() => null),
  });
}
