"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da bolsa no sistema antigo"),
});

export type GetScholarshipByOldIdInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/old_id/:id` — Busca uma bolsa pelo id do sistema antigo.
 */
export async function getScholarshipByOldId(
  input: GetScholarshipByOldIdInput,
): Promise<ActionResult<ScholarshipFullDto>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ id }) =>
      apiRequest<{ ok: boolean; scholarship: ScholarshipFullDto }>(
        `/scholarships/old_id/${encodeURIComponent(id)}`,
        {},
      ).then((response) => response.scholarship),
  });
}
