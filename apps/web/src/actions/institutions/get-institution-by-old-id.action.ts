"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { InstitutionDto } from "@/lib/api/dto";
import {
  getInstitutionByOldIdInputSchema,
  type GetInstitutionByOldIdInput,
} from "@/schemas/institutions/get-institution-by-old-id.schema";

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
    schema: getInstitutionByOldIdInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ institution: InstitutionDto }>(
        `/institutions/old_id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.institution),
  });
}
