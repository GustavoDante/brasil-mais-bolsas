"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";
import {
  searchCoursesInputSchema,
  type SearchCoursesInput,
} from "@/schemas/courses/search-courses.schema";

/**
 * `GET /v1/courses/search` — Busca cursos por nome.
 *
 * Requer sessão autenticada.
 */
export async function searchCourses(
  input: SearchCoursesInput,
): Promise<ActionResult<CourseDto[]>> {
  return executeAction({
    input,
    schema: searchCoursesInputSchema,
    auth: "required",
    run: ({ term }, { token }) =>
      apiRequest<{ ok: boolean; courses: CourseDto[] }>("/courses/search", {
        query: { term },
        token,
      }).then((response) => response.courses),
  });
}
