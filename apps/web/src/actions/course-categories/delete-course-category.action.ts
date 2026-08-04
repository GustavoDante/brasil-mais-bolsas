"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da categoria"),
});

export type DeleteCourseCategoryInput = z.infer<typeof schema>;

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
    schema,
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
