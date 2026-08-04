"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PartnerDto } from "@/lib/api/dto";
import {
  listPartnersInputSchema,
  type ListPartnersInput,
} from "@/schemas/partners/list-partners.schema";

/**
 * `GET /v1/partners` — Lista os parceiros, opcionalmente filtrando acessos por período.
 *
 * Requer sessão autenticada.
 */
export async function listPartners(
  input: ListPartnersInput,
): Promise<ActionResult<PartnerDto[]>> {
  return executeAction({
    input,
    schema: listPartnersInputSchema,
    auth: "required",
    run: ({ startDate, endDate }, { token }) =>
      apiRequest<{ ok: boolean; partners: PartnerDto[] }>("/partners", {
        query: { startDate, endDate },
        token,
      }).then((response) => response.partners),
  });
}
