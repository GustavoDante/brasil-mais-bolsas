"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalText,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NamedEntityDto } from "@/lib/api/dto";

const schema = z.object({
  term: zOptionalText(),
});

export type SearchScholarshipInstitutionsInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/search/institution` — Busca instituições que possuem bolsas.
 */
export async function searchScholarshipInstitutions(
  input: SearchScholarshipInstitutionsInput,
): Promise<ActionResult<NamedEntityDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ term }) =>
      apiRequest<{ ok: boolean; institutions: NamedEntityDto[] }>(
        "/scholarships/search/institution",
        { query: { term } },
      ).then((response) => response.institutions),
  });
}
