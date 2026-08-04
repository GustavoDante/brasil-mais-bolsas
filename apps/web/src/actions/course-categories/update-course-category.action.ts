"use server";

import { UpdateCourseCategorySchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zId,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = UpdateCourseCategorySchema.extend({ id: zId("Informe o id da categoria") });

export type UpdateCourseCategoryInput = z.infer<typeof schema>;

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
    schema,
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
