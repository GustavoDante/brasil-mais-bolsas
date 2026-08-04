"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";
import {
  getCourseByOldIdInputSchema,
  type GetCourseByOldIdInput,
} from "@/schemas/courses/get-course-by-old-id.schema";

/**
 * `GET /v1/courses/old_id/:id` — Busca um curso pelo id do sistema antigo.
 *
 * Requer sessão autenticada.
 */
export async function getCourseByOldId(
  input: GetCourseByOldIdInput,
): Promise<ActionResult<CourseDto>> {
  return executeAction({
    input,
    schema: getCourseByOldIdInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; course: CourseDto }>(
        `/courses/old_id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.course),
  });
}
