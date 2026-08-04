"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import {
  listOrderedScholarshipsInputSchema,
  type ListOrderedScholarshipsInput,
} from "@/schemas/scholarships/list-ordered-scholarships.schema";

/**
 * `GET /v1/scholarships/list/order` — Bolsas ordenadas por categoria, com filtros do site.
 */
export async function listOrderedScholarships(
  input: ListOrderedScholarshipsInput,
): Promise<ActionResult<ScholarshipFullDto[]>> {
  return executeAction({
    input,
    schema: listOrderedScholarshipsInputSchema,
    auth: "none",
    run: ({
      alreadyListed,
      type,
      institution,
      city,
      category,
      course,
      showExpired,
      showInativas,
    }) =>
      apiRequest<{ ok: boolean; scholarships: ScholarshipFullDto[] }>(
        "/scholarships/list/order",
        {
          query: {
            alreadyListed,
            type,
            institution,
            city,
            category,
            course,
            showExpired,
            showInativas,
          },
        },
      ).then((response) => response.scholarships),
  });
}
