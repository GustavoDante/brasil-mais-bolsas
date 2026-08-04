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
  city: zOptionalText(),
  category: zOptionalText(),
});

export type ListInstitutionsByCityInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/list/institution/bycity` — Lista instituições com bolsas em uma cidade e categoria.
 */
export async function listInstitutionsByCity(
  input: ListInstitutionsByCityInput,
): Promise<ActionResult<NamedEntityDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ city, category }) =>
      apiRequest<{ ok: boolean; institutions: NamedEntityDto[] }>(
        "/scholarships/list/institution/bycity",
        { query: { city, category } },
      ).then((response) => response.institutions),
  });
}
