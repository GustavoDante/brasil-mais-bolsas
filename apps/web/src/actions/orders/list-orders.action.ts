"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";
import {
  listOrdersInputSchema,
  type ListOrdersInput,
} from "@/schemas/orders/list-orders.schema";

/**
 * `GET /v1/order` — Lista pedidos com filtros e paginação.
 *
 * Requer sessão autenticada.
 */
export async function listOrders(
  input: ListOrdersInput,
): Promise<ActionResult<OrderDto[]>> {
  return executeAction({
    input,
    schema: listOrdersInputSchema,
    auth: "required",
    run: ({ user_id, expired, is_renew, defaulter, page, limit }, { token }) =>
      apiRequest<{ ok: boolean; orders: OrderDto[] }>("/order", {
        query: { user_id, expired, is_renew, defaulter, page, limit },
        token,
        revalidate: false,
      }).then((response) => response.orders),
  });
}
