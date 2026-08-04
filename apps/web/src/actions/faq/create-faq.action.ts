"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { FaqDto } from "@/lib/api/dto";
import {
  createFaqInputSchema,
  type CreateFaqInput,
} from "@/schemas/faq/create-faq.schema";

/**
 * `POST /v1/faq` — Cria uma pergunta frequente (admin).
 *
 * Requer sessão autenticada.
 */
export async function createFaq(
  input: CreateFaqInput,
): Promise<ActionResult<FaqDto>> {
  return executeAction({
    input,
    schema: createFaqInputSchema,
    auth: "required",
    successMessage: "Pergunta criada.",
    revalidateTags: ["faq"],
    run: ({ question, answer }, { token }) =>
      apiRequest<{ ok: boolean; message: string; faq: FaqDto }>("/faq", {
        method: "POST",
        body: { question, answer },
        token,
      }).then((response) => response.faq),
  });
}
