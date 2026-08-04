"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CityDto } from "@/lib/api/dto";
import {
  searchScholarshipCitiesInputSchema,
  type SearchScholarshipCitiesInput,
} from "@/schemas/scholarships/search-scholarship-cities.schema";

/**
 * `GET /v1/scholarships/search/city` — Busca cidades que possuem bolsas ativas.
 */
export async function searchScholarshipCities(
  input: SearchScholarshipCitiesInput,
): Promise<ActionResult<CityDto[]>> {
  return executeAction({
    input,
    schema: searchScholarshipCitiesInputSchema,
    auth: "none",
    run: ({ term }) =>
      apiRequest<{ ok: boolean; cities: CityDto[] }>(
        "/scholarships/search/city",
        { query: { term } },
      ).then((response) => response.cities),
  });
}
