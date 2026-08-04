"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  updateCourseInputSchema,
  type UpdateCourseInput,
} from "@/schemas/courses/update-course.schema";

/**
 * `PUT /v1/courses/:id` — Atualiza um curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function updateCourse(
  input: UpdateCourseInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: updateCourseInputSchema,
    auth: "required",
    successMessage: "Curso atualizado.",
    revalidateTags: ["courses"],
    run: ({ id, name, duration, duration_type, category_id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/courses/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: { name, duration, duration_type, category_id },
          token,
        },
      ).then(() => null),
  });
}
