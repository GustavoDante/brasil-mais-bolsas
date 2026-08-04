"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { FaqDto } from "@/lib/api/dto";
import { listFaqsInputSchema } from "@/schemas/faq/list-faqs.schema";

/**
 * `GET /v1/faq` — Lista as perguntas frequentes.
 */
export async function listFaqs(): Promise<ActionResult<FaqDto[]>> {
  return executeAction({
    input: {},
    schema: listFaqsInputSchema,
    auth: "none",
    run: (_input) =>
      apiRequest<{ ok: boolean; faqs: FaqDto[] }>("/faq", {}).then(
        (response) => response.faqs,
      )
  });
}
