"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da bolsa"),
});

export type GetScholarshipRenewInfoInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/renew/:id` — Dados de renovação de uma bolsa.
 *
 * Requer sessão autenticada.
 */
export async function getScholarshipRenewInfo(
  input: GetScholarshipRenewInfoInput,
): Promise<ActionResult<ScholarshipFullDto | undefined>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; scholarship?: ScholarshipFullDto }>(
        `/scholarships/renew/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ).then((response) => response.scholarship),
  });
}
