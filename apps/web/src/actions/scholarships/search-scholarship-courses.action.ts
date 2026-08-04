"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NamedEntityDto } from "@/lib/api/dto";
import {
  searchScholarshipCoursesInputSchema,
  type SearchScholarshipCoursesInput,
} from "@/schemas/scholarships/search-scholarship-courses.schema";

/**
 * `GET /v1/scholarships/search/course` — Busca cursos que possuem bolsas.
 */
export async function searchScholarshipCourses(
  input: SearchScholarshipCoursesInput,
): Promise<ActionResult<NamedEntityDto[]>> {
  return executeAction({
    input,
    schema: searchScholarshipCoursesInputSchema,
    auth: "none",
    run: ({ term }) =>
      apiRequest<{ ok: boolean; courses: NamedEntityDto[] }>(
        "/scholarships/search/course",
        { query: { term } },
      ).then((response) => response.courses),
  });
}
