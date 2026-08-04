"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da bolsa"),
});

export type ToggleScholarshipInput = z.infer<typeof schema>;

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
    schema,
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
