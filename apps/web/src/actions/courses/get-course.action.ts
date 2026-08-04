"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";
import {
  getCourseInputSchema,
  type GetCourseInput,
} from "@/schemas/courses/get-course.schema";

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
    schema: getCourseInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; course: CourseDto }>(
        `/courses/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.course),
  });
}
