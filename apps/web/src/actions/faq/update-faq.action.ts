"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { FaqDto } from "@/lib/api/dto";
import {
  updateFaqInputSchema,
  type UpdateFaqInput,
} from "@/schemas/faq/update-faq.schema";

/**
 * `PUT /v1/faq/:id` — Atualiza uma pergunta frequente (admin).
 *
 * Requer sessão autenticada.
 */
export async function updateFaq(
  input: UpdateFaqInput,
): Promise<ActionResult<FaqDto>> {
  return executeAction({
    input,
    schema: updateFaqInputSchema,
    auth: "required",
    successMessage: "Pergunta atualizada.",
    revalidateTags: ["faq"],
    run: ({ id, question, answer }, { token }) =>
      apiRequest<{ ok: boolean; message: string; faq: FaqDto }>(
        `/faq/${encodeURIComponent(id)}`,
        { method: "PUT", body: { question, answer }, token },
      ).then((response) => response.faq),
  });
}
