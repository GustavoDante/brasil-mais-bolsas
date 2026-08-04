"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PossiblePartnerDto } from "@/lib/api/dto";
import {
  getPossiblePartnerInputSchema,
  type GetPossiblePartnerInput,
} from "@/schemas/possible-partners/get-possible-partner.schema";

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
    schema: getPossiblePartnerInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; possiblePartner: PossiblePartnerDto }>(
        `/possible-partners/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.possiblePartner),
  });
}
