"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { FaqDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListFaqsInput = z.infer<typeof schema>;

/**
 * `GET /v1/faq` — Lista as perguntas frequentes.
 */
export async function listFaqs(): Promise<ActionResult<FaqDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "none",
    run: (_input) =>
      apiRequest<{ ok: boolean; faqs: FaqDto[] }>("/faq", {}).then(
        (response) => response.faqs,
      ),
  });
}
