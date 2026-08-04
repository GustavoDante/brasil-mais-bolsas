"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da pergunta"),
});

export type DeleteFaqInput = z.infer<typeof schema>;

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
    schema,
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
