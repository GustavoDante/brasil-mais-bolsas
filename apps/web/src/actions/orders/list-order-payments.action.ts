"use server";

import { OrderPaymentsQuerySchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PaymentDto } from "@/lib/api/dto";

const schema = OrderPaymentsQuerySchema;

export type ListOrderPaymentsInput = z.infer<typeof schema>;

/**
 * `GET /v1/order/payments` — Lista os pagamentos de um pedido.
 *
 * Requer sessão autenticada.
 */
export async function listOrderPayments(
  input: ListOrderPaymentsInput,
): Promise<ActionResult<PaymentDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ order_id }, { token }) =>
      apiRequest<{ ok: boolean; payments: PaymentDto[] }>("/order/payments", {
        query: { order_id },
        token,
        revalidate: false,
      }).then((response) => response.payments),
  });
}
