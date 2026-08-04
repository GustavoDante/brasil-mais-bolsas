"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import {
  listAllScholarshipsInputSchema,
  type ListAllScholarshipsInput,
} from "@/schemas/scholarships/list-all-scholarships.schema";

/**
 * `GET /v1/scholarships/list/all` — Lista todas as bolsas com os filtros do backoffice.
 *
 * Requer sessão autenticada.
 */
export async function listAllScholarships(
  input: ListAllScholarshipsInput,
): Promise<ActionResult<ScholarshipFullDto[]>> {
  return executeAction({
    input,
    schema: listAllScholarshipsInputSchema,
    auth: "required",
    run: (
      {
        alreadyListed,
        type,
        institution,
        city,
        category,
        course,
        showExpired,
        showInativas,
      },
      { token },
    ) =>
      apiRequest<{ ok: boolean; scholarships: ScholarshipFullDto[] }>(
        "/scholarships/list/all",
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
          token,
        },
      ).then((response) => response.scholarships),
  });
}
