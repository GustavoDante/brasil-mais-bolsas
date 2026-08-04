"use server";

import { UpdateCourseSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zId,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = UpdateCourseSchema.extend({ id: zId("Informe o id do curso") });

export type UpdateCourseInput = z.infer<typeof schema>;

/**
 * `PUT /v1/courses/:id` — Atualiza um curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function updateCourse(
  input: UpdateCourseInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Curso atualizado.",
    revalidateTags: ["courses"],
    run: ({ id, name, duration, duration_type, category_id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/courses/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: { name, duration, duration_type, category_id },
          token,
        },
      ).then(() => null),
  });
}
