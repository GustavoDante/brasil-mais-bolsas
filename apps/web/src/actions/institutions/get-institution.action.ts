"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { InstitutionDto } from "@/lib/api/dto";
import {
  getInstitutionInputSchema,
  type GetInstitutionInput,
} from "@/schemas/institutions/get-institution.schema";

/**
 * `GET /v1/institutions/id/:id` — Busca uma instituição pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getInstitution(
  input: GetInstitutionInput,
): Promise<ActionResult<InstitutionDto>> {
  return executeAction({
    input,
    schema: getInstitutionInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ institution: InstitutionDto }>(
        `/institutions/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.institution),
  });
}
