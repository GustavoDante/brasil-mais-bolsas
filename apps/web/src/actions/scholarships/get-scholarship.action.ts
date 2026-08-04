"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da bolsa"),
});

export type GetScholarshipInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; scholarship: ScholarshipFullDto }>(
        `/scholarships/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.scholarship),
  });
}
