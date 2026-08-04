"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseCategoryDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da categoria"),
});

export type GetCourseCategoryInput = z.infer<typeof schema>;

/**
 * `GET /v1/course-categories/:id` — Busca uma categoria pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getCourseCategory(
  input: GetCourseCategoryInput,
): Promise<ActionResult<CourseCategoryDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; courseCategory: CourseCategoryDto }>(
        `/course-categories/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.courseCategory),
  });
}
