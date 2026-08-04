"use server";

import { UpdateFaqSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zId,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { FaqDto } from "@/lib/api/dto";

const schema = UpdateFaqSchema.extend({ id: zId("Informe o id da pergunta") });

export type UpdateFaqInput = z.infer<typeof schema>;

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
    schema,
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
