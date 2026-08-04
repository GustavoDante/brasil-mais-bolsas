"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalDateString,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PartnerDto } from "@/lib/api/dto";

const schema = z.object({
  startDate: zOptionalDateString(),
  endDate: zOptionalDateString(),
});

export type ListPartnersInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ startDate, endDate }, { token }) =>
      apiRequest<{ ok: boolean; partners: PartnerDto[] }>("/partners", {
        query: { startDate, endDate },
        token,
      }).then((response) => response.partners),
  });
}
