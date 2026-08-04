"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PartnerDto } from "@/lib/api/dto";
import {
  getPartnerInputSchema,
  type GetPartnerInput,
} from "@/schemas/partners/get-partner.schema";

/**
 * `GET /v1/partners/id/:id` — Busca um parceiro pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getPartner(
  input: GetPartnerInput,
): Promise<ActionResult<PartnerDto>> {
  return executeAction({
    input,
    schema: getPartnerInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; partner: PartnerDto }>(
        `/partners/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.partner),
  });
}
