"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da categoria"),
});

export type ToggleCourseCategoryInput = z.infer<typeof schema>;

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
    schema,
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
