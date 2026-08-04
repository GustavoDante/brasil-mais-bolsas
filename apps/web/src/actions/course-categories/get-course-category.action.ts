"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseCategoryDto } from "@/lib/api/dto";
import {
  getCourseCategoryInputSchema,
  type GetCourseCategoryInput,
} from "@/schemas/course-categories/get-course-category.schema";

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
    schema: getCourseCategoryInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; courseCategory: CourseCategoryDto }>(
        `/course-categories/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.courseCategory),
  });
}
