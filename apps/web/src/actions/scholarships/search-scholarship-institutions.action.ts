"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NamedEntityDto } from "@/lib/api/dto";
import {
  searchScholarshipInstitutionsInputSchema,
  type SearchScholarshipInstitutionsInput,
} from "@/schemas/scholarships/search-scholarship-institutions.schema";

/**
 * `GET /v1/scholarships/search/institution` — Busca instituições que possuem bolsas.
 */
export async function searchScholarshipInstitutions(
  input: SearchScholarshipInstitutionsInput,
): Promise<ActionResult<NamedEntityDto[]>> {
  return executeAction({
    input,
    schema: searchScholarshipInstitutionsInputSchema,
    auth: "none",
    run: ({ term }) =>
      apiRequest<{ ok: boolean; institutions: NamedEntityDto[] }>(
        "/scholarships/search/institution",
        { query: { term } },
      ).then((response) => response.institutions),
  });
}
