"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { InstitutionDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da instituição no sistema antigo"),
});

export type GetInstitutionByOldIdInput = z.infer<typeof schema>;

/**
 * `GET /v1/institutions/old_id/:id` — Busca uma instituição pelo id do sistema antigo.
 *
 * Requer sessão autenticada.
 */
export async function getInstitutionByOldId(
  input: GetInstitutionByOldIdInput,
): Promise<ActionResult<InstitutionDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ institution: InstitutionDto }>(
        `/institutions/old_id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.institution),
  });
}
