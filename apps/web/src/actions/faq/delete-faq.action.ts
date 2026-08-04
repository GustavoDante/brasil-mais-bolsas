"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteFaqInputSchema,
  type DeleteFaqInput,
} from "@/schemas/faq/delete-faq.schema";

/**
 * `DELETE /v1/faq/:id` — Remove uma pergunta frequente (admin).
 *
 * Requer sessão autenticada.
 */
export async function deleteFaq(
  input: DeleteFaqInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteFaqInputSchema,
    auth: "required",
    successMessage: "Pergunta removida.",
    revalidateTags: ["faq"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/faq/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
