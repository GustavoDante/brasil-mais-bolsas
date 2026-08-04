"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { InstitutionDto } from "@/lib/api/dto";
import {
  searchInstitutionsInputSchema,
  type SearchInstitutionsInput,
} from "@/schemas/institutions/search-institutions.schema";

/**
 * `GET /v1/institutions/search` — Busca instituições por nome.
 *
 * Requer sessão autenticada.
 */
export async function searchInstitutions(
  input: SearchInstitutionsInput,
): Promise<ActionResult<InstitutionDto[]>> {
  return executeAction({
    input,
    schema: searchInstitutionsInputSchema,
    auth: "required",
    run: ({ term }, { token }) =>
      apiRequest<{ institutions: InstitutionDto[] }>("/institutions/search", {
        query: { term },
        token,
      }).then((response) => response.institutions),
  });
}
