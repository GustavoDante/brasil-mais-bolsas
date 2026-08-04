"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import {
  listRandomScholarshipsInputSchema,
  type ListRandomScholarshipsInput,
} from "@/schemas/scholarships/list-random-scholarships.schema";

/**
 * `GET /v1/scholarships/list/random` — Bolsas aleatórias para os destaques do site.
 */
export async function listRandomScholarships(
  input: ListRandomScholarshipsInput,
): Promise<ActionResult<ScholarshipFullDto[]>> {
  return executeAction({
    input,
    schema: listRandomScholarshipsInputSchema,
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
        "/scholarships/list/random",
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
