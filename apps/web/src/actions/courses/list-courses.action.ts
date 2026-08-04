"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";
import { listCoursesInputSchema } from "@/schemas/courses/list-courses.schema";

/**
 * `GET /v1/courses` — Lista os cursos (admin vê todos; manager vê os da instituição).
 *
 * Requer sessão autenticada.
 */
export async function listCourses(): Promise<ActionResult<CourseDto[]>> {
  return executeAction({
    input: {},
    schema: listCoursesInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; courses: CourseDto[] }>("/courses", {
        token
      }).then((response) => response.courses)
  });
}
