"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import {
  getScholarshipRenewInfoInputSchema,
  type GetScholarshipRenewInfoInput,
} from "@/schemas/scholarships/get-scholarship-renew-info.schema";

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
    schema: getScholarshipRenewInfoInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; scholarship?: ScholarshipFullDto }>(
        `/scholarships/renew/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ).then((response) => response.scholarship),
  });
}
