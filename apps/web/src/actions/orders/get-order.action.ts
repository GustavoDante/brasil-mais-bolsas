"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";
import {
  getOrderInputSchema,
  type GetOrderInput,
} from "@/schemas/orders/get-order.schema";

/**
 * `GET /v1/order/id/:id` — Busca um pedido pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getOrder(
  input: GetOrderInput,
): Promise<ActionResult<OrderDto>> {
  return executeAction({
    input,
    schema: getOrderInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; order: OrderDto }>(
        `/order/id/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ).then((response) => response.order),
  });
}
