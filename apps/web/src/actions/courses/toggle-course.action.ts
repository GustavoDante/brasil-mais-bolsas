"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  toggleCourseInputSchema,
  type ToggleCourseInput,
} from "@/schemas/courses/toggle-course.schema";

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
    schema: toggleCourseInputSchema,
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
