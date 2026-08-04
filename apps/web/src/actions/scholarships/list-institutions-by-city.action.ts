"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NamedEntityDto } from "@/lib/api/dto";
import {
  listInstitutionsByCityInputSchema,
  type ListInstitutionsByCityInput,
} from "@/schemas/scholarships/list-institutions-by-city.schema";

/**
 * `GET /v1/scholarships/list/institution/bycity` — Lista instituições com bolsas em uma cidade e categoria.
 */
export async function listInstitutionsByCity(
  input: ListInstitutionsByCityInput,
): Promise<ActionResult<NamedEntityDto[]>> {
  return executeAction({
    input,
    schema: listInstitutionsByCityInputSchema,
    auth: "none",
    run: ({ city, category }) =>
      apiRequest<{ ok: boolean; institutions: NamedEntityDto[] }>(
        "/scholarships/list/institution/bycity",
        { query: { city, category } },
      ).then((response) => response.institutions),
  });
}
