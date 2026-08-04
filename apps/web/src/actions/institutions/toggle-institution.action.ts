"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da instituição"),
});

export type ToggleInstitutionInput = z.infer<typeof schema>;

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
    schema,
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
