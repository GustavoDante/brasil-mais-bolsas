"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id do curso"),
});

export type ToggleCourseInput = z.infer<typeof schema>;

/**
 * `PATCH /v1/courses/:id/toggle` — Ativa/desativa um curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function toggleCourse(
  input: ToggleCourseInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Curso atualizado.",
    revalidateTags: ["courses"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/courses/${encodeURIComponent(id)}/toggle`,
        { method: "PATCH", token },
      ).then(() => null),
  });
}
