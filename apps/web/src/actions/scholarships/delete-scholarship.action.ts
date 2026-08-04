"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da bolsa"),
});

export type DeleteScholarshipInput = z.infer<typeof schema>;

/**
 * `DELETE /v1/scholarships/:id` — Remove uma bolsa (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteScholarship(
  input: DeleteScholarshipInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Bolsa removida.",
    revalidateTags: ["scholarships"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/scholarships/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
