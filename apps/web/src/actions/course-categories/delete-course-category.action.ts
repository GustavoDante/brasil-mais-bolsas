"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteCourseCategoryInputSchema,
  type DeleteCourseCategoryInput,
} from "@/schemas/course-categories/delete-course-category.schema";

/**
 * `DELETE /v1/course-categories/:id` — Remove uma categoria de curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteCourseCategory(
  input: DeleteCourseCategoryInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteCourseCategoryInputSchema,
    auth: "required",
    successMessage: "Categoria removida.",
    revalidateTags: ["course-categories"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/course-categories/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
