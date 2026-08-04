"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CityDto } from "@/lib/api/dto";
import { listScholarshipCitiesInputSchema } from "@/schemas/scholarships/list-scholarship-cities.schema";

/**
 * `GET /v1/scholarships/list/city` — Lista todas as cidades com bolsas.
 */
export async function listScholarshipCities(): Promise<
  ActionResult<CityDto[]>
> {
  return executeAction({
    input: {},
    schema: listScholarshipCitiesInputSchema,
    auth: "none",
    run: (_input) =>
      apiRequest<{ ok: boolean; cities: CityDto[] }>(
        "/scholarships/list/city",
        {},
      ).then((response) => response.cities)
  });
}
