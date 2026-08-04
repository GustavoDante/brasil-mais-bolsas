"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteScholarshipInputSchema,
  type DeleteScholarshipInput,
} from "@/schemas/scholarships/delete-scholarship.schema";

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
    schema: deleteScholarshipInputSchema,
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
