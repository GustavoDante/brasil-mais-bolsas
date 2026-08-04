"use server";

import { OrderListQuerySchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";

const schema = OrderListQuerySchema;

export type ListOrdersInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ user_id, expired, is_renew, defaulter, page, limit }, { token }) =>
      apiRequest<{ ok: boolean; orders: OrderDto[] }>("/order", {
        query: { user_id, expired, is_renew, defaulter, page, limit },
        token,
        revalidate: false,
      }).then((response) => response.orders),
  });
}
