"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SellerDto } from "@/lib/api/dto";
import {
  getSellerInputSchema,
  type GetSellerInput,
} from "@/schemas/sellers/get-seller.schema";

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
    schema: getSellerInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; seller: SellerDto }>(
        `/sellers/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.seller),
  });
}
