"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  createCourseCategoryInputSchema,
  type CreateCourseCategoryInput,
} from "@/schemas/course-categories/create-course-category.schema";

/**
 * `POST /v1/course-categories` — Cria uma categoria de curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function createCourseCategory(
  input: CreateCourseCategoryInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: createCourseCategoryInputSchema,
    auth: "required",
    successMessage: "Categoria criada.",
    revalidateTags: ["course-categories"],
    run: ({ name, old_id, order }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>("/course-categories", {
        method: "POST",
        body: { name, old_id, order },
        token,
      }).then(() => null),
  });
}
