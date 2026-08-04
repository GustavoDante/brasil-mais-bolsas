"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListCoursesInput = z.infer<typeof schema>;

/**
 * `GET /v1/courses` — Lista os cursos (admin vê todos; manager vê os da instituição).
 *
 * Requer sessão autenticada.
 */
export async function listCourses(): Promise<ActionResult<CourseDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; courses: CourseDto[] }>("/courses", {
        token,
      }).then((response) => response.courses),
  });
}
