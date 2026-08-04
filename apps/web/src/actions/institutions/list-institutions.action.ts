"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { InstitutionDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListInstitutionsInput = z.infer<typeof schema>;

/**
 * `GET /v1/institutions` — Lista as instituições (admin vê todas; manager vê a sua).
 *
 * Requer sessão autenticada.
 */
export async function listInstitutions(): Promise<
  ActionResult<InstitutionDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ institutions: InstitutionDto[] }>("/institutions", {
        token,
      }).then((response) => response.institutions),
  });
}
