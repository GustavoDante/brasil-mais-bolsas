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

export type SearchInstitutionsInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ term }, { token }) =>
      apiRequest<{ institutions: InstitutionDto[] }>("/institutions/search", {
        query: { term },
        token,
      }).then((response) => response.institutions),
  });
}
