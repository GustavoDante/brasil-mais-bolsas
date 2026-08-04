"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do curso"),
});

export type GetCourseInput = z.infer<typeof schema>;

/**
 * `GET /v1/courses/id/:id` — Busca um curso pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getCourse(
  input: GetCourseInput,
): Promise<ActionResult<CourseDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; course: CourseDto }>(
        `/courses/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.course),
  });
}
