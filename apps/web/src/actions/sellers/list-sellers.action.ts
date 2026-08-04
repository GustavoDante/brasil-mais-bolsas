"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalDateString,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SellerDto } from "@/lib/api/dto";

const schema = z.object({
  startDate: zOptionalDateString(),
  endDate: zOptionalDateString(),
});

export type ListSellersInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ startDate, endDate }, { token }) =>
      apiRequest<{ ok: boolean; sellers: SellerDto[] }>("/sellers", {
        query: { startDate, endDate },
        token,
      }).then((response) => response.sellers),
  });
}
