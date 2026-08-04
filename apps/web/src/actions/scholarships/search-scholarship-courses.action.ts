"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalText,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NamedEntityDto } from "@/lib/api/dto";

const schema = z.object({
  term: zOptionalText(),
});

export type SearchScholarshipCoursesInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/search/course` — Busca cursos que possuem bolsas.
 */
export async function searchScholarshipCourses(
  input: SearchScholarshipCoursesInput,
): Promise<ActionResult<NamedEntityDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ term }) =>
      apiRequest<{ ok: boolean; courses: NamedEntityDto[] }>(
        "/scholarships/search/course",
        { query: { term } },
      ).then((response) => response.courses),
  });
}
