"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalText,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";

const schema = z.object({
  term: zOptionalText(),
});

export type SearchCoursesInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ term }, { token }) =>
      apiRequest<{ ok: boolean; courses: CourseDto[] }>("/courses/search", {
        query: { term },
        token,
      }).then((response) => response.courses),
  });
}
