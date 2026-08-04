"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";
import {
  getOrderVoucherInputSchema,
  type GetOrderVoucherInput,
} from "@/schemas/orders/get-order-voucher.schema";

/**
 * `GET /v1/order/voucher` — Busca o voucher do pedido de uma bolsa.
 *
 * Requer sessão autenticada.
 */
export async function getOrderVoucher(
  input: GetOrderVoucherInput,
): Promise<ActionResult<OrderDto | null>> {
  return executeAction({
    input,
    schema: getOrderVoucherInputSchema,
    auth: "required",
    run: ({ scholarship_id }, { token }) =>
      apiRequest<{ ok: boolean; voucher: OrderDto | null }>("/order/voucher", {
        query: { scholarship_id },
        token,
        revalidate: false,
      }).then((response) => response.voucher),
  });
}
