"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import {
  getScholarshipInputSchema,
  type GetScholarshipInput,
} from "@/schemas/scholarships/get-scholarship.schema";

/**
 * `GET /v1/scholarships/:id` — Busca uma bolsa pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getScholarship(
  input: GetScholarshipInput,
): Promise<ActionResult<ScholarshipFullDto>> {
  return executeAction({
    input,
    schema: getScholarshipInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; scholarship: ScholarshipFullDto }>(
        `/scholarships/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.scholarship),
  });
}
