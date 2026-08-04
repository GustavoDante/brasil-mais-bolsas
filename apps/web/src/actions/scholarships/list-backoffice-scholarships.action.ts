"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import {
  listBackofficeScholarshipsInputSchema,
  type ListBackofficeScholarshipsInput,
} from "@/schemas/scholarships/list-backoffice-scholarships.schema";

/**
 * `GET /v1/scholarships/list/backoffice` — Lista as bolsas do backoffice com contagem de vendas.
 *
 * Requer sessão autenticada.
 */
export async function listBackofficeScholarships(
  input: ListBackofficeScholarshipsInput,
): Promise<ActionResult<ScholarshipFullDto[]>> {
  return executeAction({
    input,
    schema: listBackofficeScholarshipsInputSchema,
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
        "/scholarships/list/backoffice",
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
