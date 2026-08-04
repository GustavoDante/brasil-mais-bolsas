"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import {
  getScholarshipByOldIdInputSchema,
  type GetScholarshipByOldIdInput,
} from "@/schemas/scholarships/get-scholarship-by-old-id.schema";

/**
 * `GET /v1/scholarships/old_id/:id` — Busca uma bolsa pelo id do sistema antigo.
 */
export async function getScholarshipByOldId(
  input: GetScholarshipByOldIdInput,
): Promise<ActionResult<ScholarshipFullDto>> {
  return executeAction({
    input,
    schema: getScholarshipByOldIdInputSchema,
    auth: "none",
    run: ({ id }) =>
      apiRequest<{ ok: boolean; scholarship: ScholarshipFullDto }>(
        `/scholarships/old_id/${encodeURIComponent(id)}`,
        {},
      ).then((response) => response.scholarship),
  });
}
