"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseCategoryDto } from "@/lib/api/dto";
import {
  getCourseCategoryByOldIdInputSchema,
  type GetCourseCategoryByOldIdInput,
} from "@/schemas/course-categories/get-course-category-by-old-id.schema";

/**
 * `GET /v1/course-categories/old_id/:id` — Busca uma categoria pelo id do sistema antigo.
 *
 * Requer sessão autenticada.
 */
export async function getCourseCategoryByOldId(
  input: GetCourseCategoryByOldIdInput,
): Promise<ActionResult<CourseCategoryDto>> {
  return executeAction({
    input,
    schema: getCourseCategoryByOldIdInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; courseCategory: CourseCategoryDto }>(
        `/course-categories/old_id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.courseCategory),
  });
}
