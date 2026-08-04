"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PossiblePartnerDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do possível parceiro"),
});

export type GetPossiblePartnerInput = z.infer<typeof schema>;

/**
 * `GET /v1/possible-partners/id/:id` — Busca um possível parceiro pelo id (admin).
 *
 * Requer sessão autenticada.
 */
export async function getPossiblePartner(
  input: GetPossiblePartnerInput,
): Promise<ActionResult<PossiblePartnerDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; possiblePartner: PossiblePartnerDto }>(
        `/possible-partners/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.possiblePartner),
  });
}
