"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListExpiredOrdersInput = z.infer<typeof schema>;

/**
 * `GET /v1/order/expired` — Lista os pedidos expirados do usuário.
 *
 * Requer sessão autenticada.
 */
export async function listExpiredOrders(): Promise<ActionResult<OrderDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; orders: OrderDto[] }>("/order/expired", {
        token,
        revalidate: false,
      }).then((response) => response.orders),
  });
}
