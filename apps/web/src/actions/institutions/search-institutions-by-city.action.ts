"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { InstitutionDto } from "@/lib/api/dto";
import {
  searchInstitutionsByCityInputSchema,
  type SearchInstitutionsByCityInput,
} from "@/schemas/institutions/search-institutions-by-city.schema";

/**
 * `GET /v1/institutions/search/by_city` — Busca instituições por cidade.
 *
 * Requer sessão autenticada.
 */
export async function searchInstitutionsByCity(
  input: SearchInstitutionsByCityInput,
): Promise<ActionResult<InstitutionDto[]>> {
  return executeAction({
    input,
    schema: searchInstitutionsByCityInputSchema,
    auth: "required",
    run: ({ term }, { token }) =>
      apiRequest<{ courses: InstitutionDto[] }>(
        "/institutions/search/by_city",
        { query: { term }, token },
      ).then((response) => response.courses),
  });
}
