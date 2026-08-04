"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SellerDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do vendedor"),
});

export type GetSellerInput = z.infer<typeof schema>;

/**
 * `GET /v1/sellers/id/:id` — Busca um vendedor pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getSeller(
  input: GetSellerInput,
): Promise<ActionResult<SellerDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; seller: SellerDto }>(
        `/sellers/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.seller),
  });
}
