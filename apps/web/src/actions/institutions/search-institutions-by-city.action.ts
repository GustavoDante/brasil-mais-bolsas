"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalText,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { InstitutionDto } from "@/lib/api/dto";

const schema = z.object({
  term: zOptionalText(),
});

export type SearchInstitutionsByCityInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ term }, { token }) =>
      apiRequest<{ courses: InstitutionDto[] }>(
        "/institutions/search/by_city",
        { query: { term }, token },
      ).then((response) => response.courses),
  });
}
