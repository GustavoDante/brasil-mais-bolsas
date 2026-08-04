"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SellerDto } from "@/lib/api/dto";
import {
  listSellersInputSchema,
  type ListSellersInput,
} from "@/schemas/sellers/list-sellers.schema";

/**
 * `GET /v1/sellers` — Lista os vendedores, opcionalmente filtrando por período.
 *
 * Requer sessão autenticada.
 */
export async function listSellers(
  input: ListSellersInput,
): Promise<ActionResult<SellerDto[]>> {
  return executeAction({
    input,
    schema: listSellersInputSchema,
    auth: "required",
    run: ({ startDate, endDate }, { token }) =>
      apiRequest<{ ok: boolean; sellers: SellerDto[] }>("/sellers", {
        query: { startDate, endDate },
        token,
      }).then((response) => response.sellers),
  });
}
