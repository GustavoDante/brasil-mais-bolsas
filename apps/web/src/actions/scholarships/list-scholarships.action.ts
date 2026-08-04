"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import { listScholarshipsInputSchema } from "@/schemas/scholarships/list-scholarships.schema";

/**
 * `GET /v1/scholarships` — Lista as bolsas do backoffice (admin/manager).
 *
 * Requer sessão autenticada.
 */
export async function listScholarships(): Promise<
  ActionResult<ScholarshipFullDto[]>
> {
  return executeAction({
    input: {},
    schema: listScholarshipsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; scholarships: ScholarshipFullDto[] }>(
        "/scholarships",
        { token },
      ).then((response) => response.scholarships)
  });
}
