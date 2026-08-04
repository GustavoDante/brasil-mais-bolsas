"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseCategoryDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da categoria no sistema antigo"),
});

export type GetCourseCategoryByOldIdInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; courseCategory: CourseCategoryDto }>(
        `/course-categories/old_id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.courseCategory),
  });
}
