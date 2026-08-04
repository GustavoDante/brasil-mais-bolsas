"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PossiblePartnerDto } from "@/lib/api/dto";
import { listPossiblePartnersInputSchema } from "@/schemas/possible-partners/list-possible-partners.schema";

/**
 * `GET /v1/possible-partners` — Lista os possíveis parceiros (admin).
 *
 * Requer sessão autenticada.
 */
export async function listPossiblePartners(): Promise<
  ActionResult<PossiblePartnerDto[]>
> {
  return executeAction({
    input: {},
    schema: listPossiblePartnersInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; possiblePartners: PossiblePartnerDto[] }>(
        "/possible-partners",
        { token },
      ).then((response) => response.possiblePartners)
  });
}
