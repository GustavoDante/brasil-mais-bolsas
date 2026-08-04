"use server";

import { CreateFaqSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { FaqDto } from "@/lib/api/dto";

const schema = CreateFaqSchema;

export type CreateFaqInput = z.infer<typeof schema>;

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
    schema,
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
