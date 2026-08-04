"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalText,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CityDto } from "@/lib/api/dto";

const schema = z.object({
  term: zOptionalText(),
});

export type SearchScholarshipCitiesInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/search/city` — Busca cidades que possuem bolsas ativas.
 */
export async function searchScholarshipCities(
  input: SearchScholarshipCitiesInput,
): Promise<ActionResult<CityDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ term }) =>
      apiRequest<{ ok: boolean; cities: CityDto[] }>(
        "/scholarships/search/city",
        { query: { term } },
      ).then((response) => response.cities),
  });
}
