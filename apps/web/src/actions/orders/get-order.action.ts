"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do pedido"),
});

export type GetOrderInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; order: OrderDto }>(
        `/order/id/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ).then((response) => response.order),
  });
}
