"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  toggleCourseCategoryInputSchema,
  type ToggleCourseCategoryInput,
} from "@/schemas/course-categories/toggle-course-category.schema";

/**
 * `PATCH /v1/course-categories/:id/toggle` — Ativa/desativa uma categoria de curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function toggleCourseCategory(
  input: ToggleCourseCategoryInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: toggleCourseCategoryInputSchema,
    auth: "required",
    successMessage: "Categoria atualizada.",
    revalidateTags: ["course-categories"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/course-categories/${encodeURIComponent(id)}/toggle`,
        { method: "PATCH", token },
      ).then(() => null),
  });
}
