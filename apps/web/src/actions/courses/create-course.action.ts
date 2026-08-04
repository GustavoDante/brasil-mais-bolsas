"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  createCourseInputSchema,
  type CreateCourseInput,
} from "@/schemas/courses/create-course.schema";

/**
 * `POST /v1/courses` — Cria um curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function createCourse(
  input: CreateCourseInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: createCourseInputSchema,
    auth: "required",
    successMessage: "Curso criado.",
    revalidateTags: ["courses"],
    run: ({ name, duration, duration_type, category_id, old_id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>("/courses", {
        method: "POST",
        body: { name, duration, duration_type, category_id, old_id },
        token,
      }).then(() => null),
  });
}
