"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  toggleScholarshipInputSchema,
  type ToggleScholarshipInput,
} from "@/schemas/scholarships/toggle-scholarship.schema";

/**
 * `PATCH /v1/scholarships/:id/toggle` — Ativa/desativa uma bolsa (admin).
 *
 * Requer sessão autenticada.
 */
export async function toggleScholarship(
  input: ToggleScholarshipInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: toggleScholarshipInputSchema,
    auth: "required",
    successMessage: "Bolsa atualizada.",
    revalidateTags: ["scholarships"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/scholarships/${encodeURIComponent(id)}/toggle`,
        { method: "PATCH", token },
      ).then(() => null),
  });
}
