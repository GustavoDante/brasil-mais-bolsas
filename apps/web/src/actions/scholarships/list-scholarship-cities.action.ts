"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CityDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListScholarshipCitiesInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/list/city` — Lista todas as cidades com bolsas.
 */
export async function listScholarshipCities(): Promise<
  ActionResult<CityDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "none",
    run: (_input) =>
      apiRequest<{ ok: boolean; cities: CityDto[] }>(
        "/scholarships/list/city",
        {},
      ).then((response) => response.cities),
  });
}
