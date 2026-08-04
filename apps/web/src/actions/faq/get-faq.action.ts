"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { FaqDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da pergunta"),
});

export type GetFaqInput = z.infer<typeof schema>;

/**
 * `GET /v1/faq/:id` — Busca uma pergunta pelo id.
 */
export async function getFaq(
  input: GetFaqInput,
): Promise<ActionResult<FaqDto>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ id }) =>
      apiRequest<{ ok: boolean; faq: FaqDto }>(
        `/faq/${encodeURIComponent(id)}`,
        {},
      ).then((response) => response.faq),
  });
}
