"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";
import { listExpiredOrdersInputSchema } from "@/schemas/orders/list-expired-orders.schema";

/**
 * `GET /v1/order/expired` — Lista os pedidos expirados do usuário.
 *
 * Requer sessão autenticada.
 */
export async function listExpiredOrders(): Promise<ActionResult<OrderDto[]>> {
  return executeAction({
    input: {},
    schema: listExpiredOrdersInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; orders: OrderDto[] }>("/order/expired", {
        token,
        revalidate: false
      }).then((response) => response.orders)
  });
}
