"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NamedEntityDto } from "@/lib/api/dto";
import {
  listCoursesByCityInputSchema,
  type ListScholarshipCoursesByCityInput,
} from "@/schemas/scholarships/list-courses-by-city.schema";

/**
 * `GET /v1/scholarships/list/course/bycity` — Lista cursos com bolsas em uma cidade e categoria.
 */
export async function listScholarshipCoursesByCity(
  input: ListScholarshipCoursesByCityInput,
): Promise<ActionResult<NamedEntityDto[]>> {
  return executeAction({
    input,
    schema: listCoursesByCityInputSchema,
    auth: "none",
    run: ({ city, category }) =>
      apiRequest<{ ok: boolean; courses: NamedEntityDto[] }>(
        "/scholarships/list/course/bycity",
        { query: { city, category } },
      ).then((response) => response.courses),
  });
}
