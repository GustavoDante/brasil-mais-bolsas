"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";
import {
  listCoursesByInstitutionInputSchema,
  type ListCoursesByInstitutionInput,
} from "@/schemas/courses/list-courses-by-institution.schema";

/**
 * `GET /v1/courses/institution/:id` — Lista os cursos oferecidos por uma instituição.
 */
export async function listCoursesByInstitution(
  input: ListCoursesByInstitutionInput,
): Promise<ActionResult<CourseDto[]>> {
  return executeAction({
    input,
    schema: listCoursesByInstitutionInputSchema,
    auth: "none",
    run: ({ id }) =>
      apiRequest<{ ok: boolean; courses: CourseDto[] }>(
        `/courses/institution/${encodeURIComponent(id)}`,
        {},
      ).then((response) => response.courses),
  });
}
