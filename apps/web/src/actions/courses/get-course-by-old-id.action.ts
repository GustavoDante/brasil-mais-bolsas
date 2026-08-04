"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do curso no sistema antigo"),
});

export type GetCourseByOldIdInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; course: CourseDto }>(
        `/courses/old_id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.course),
  });
}
