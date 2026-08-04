"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  updateCourseCategoryInputSchema,
  type UpdateCourseCategoryInput,
} from "@/schemas/course-categories/update-course-category.schema";

/**
 * `PUT /v1/course-categories/:id` — Atualiza uma categoria de curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function updateCourseCategory(
  input: UpdateCourseCategoryInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: updateCourseCategoryInputSchema,
    auth: "required",
    successMessage: "Categoria atualizada.",
    revalidateTags: ["course-categories"],
    run: ({ id, name, order }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/course-categories/${encodeURIComponent(id)}`,
        { method: "PUT", body: { name, order }, token },
      ).then(() => null),
  });
}
