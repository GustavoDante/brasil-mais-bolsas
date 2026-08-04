"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da instituição"),
});

export type ListCoursesByInstitutionInput = z.infer<typeof schema>;

/**
 * `GET /v1/courses/institution/:id` — Lista os cursos oferecidos por uma instituição.
 */
export async function listCoursesByInstitution(
  input: ListCoursesByInstitutionInput,
): Promise<ActionResult<CourseDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ id }) =>
      apiRequest<{ ok: boolean; courses: CourseDto[] }>(
        `/courses/institution/${encodeURIComponent(id)}`,
        {},
      ).then((response) => response.courses),
  });
}
