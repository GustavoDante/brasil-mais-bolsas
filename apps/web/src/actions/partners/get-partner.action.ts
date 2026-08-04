"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PartnerDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do parceiro"),
});

export type GetPartnerInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; partner: PartnerDto }>(
        `/partners/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.partner),
  });
}
