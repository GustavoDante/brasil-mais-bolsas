"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id do curso"),
});

export type DeleteCourseInput = z.infer<typeof schema>;

/**
 * `DELETE /v1/courses/:id` — Remove um curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteCourse(
  input: DeleteCourseInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Curso removido.",
    revalidateTags: ["courses"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/courses/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
