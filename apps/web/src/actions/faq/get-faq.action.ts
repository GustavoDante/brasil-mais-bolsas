"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { FaqDto } from "@/lib/api/dto";
import {
  getFaqInputSchema,
  type GetFaqInput,
} from "@/schemas/faq/get-faq.schema";

/**
 * `GET /v1/faq/:id` — Busca uma pergunta pelo id.
 */
export async function getFaq(
  input: GetFaqInput,
): Promise<ActionResult<FaqDto>> {
  return executeAction({
    input,
    schema: getFaqInputSchema,
    auth: "none",
    run: ({ id }) =>
      apiRequest<{ ok: boolean; faq: FaqDto }>(
        `/faq/${encodeURIComponent(id)}`,
        {},
      ).then((response) => response.faq),
  });
}
