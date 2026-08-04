"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteCourseInputSchema,
  type DeleteCourseInput,
} from "@/schemas/courses/delete-course.schema";

/**
 * `DELETE /v1/courses/:id` — Remove um curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteCourse(
  input: DeleteCourseInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteCourseInputSchema,
    auth: "required",
    successMessage: "Curso removido.",
    revalidateTags: ["courses"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/courses/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
