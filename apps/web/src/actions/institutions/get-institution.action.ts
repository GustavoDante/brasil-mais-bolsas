"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { InstitutionDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da instituição"),
});

export type GetInstitutionInput = z.infer<typeof schema>;

/**
 * `GET /v1/institutions/id/:id` — Busca uma instituição pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getInstitution(
  input: GetInstitutionInput,
): Promise<ActionResult<InstitutionDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ institution: InstitutionDto }>(
        `/institutions/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.institution),
  });
}
