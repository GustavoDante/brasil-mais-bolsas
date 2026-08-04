"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  updateOrderDefaulterInputSchema,
  type UpdateOrderDefaulterInput,
} from "@/schemas/orders/update-order-defaulter.schema";

/**
 * `POST /v1/order/update-defaulter` — Marca/desmarca um pedido como inadimplente (admin ou manager).
 *
 * Requer sessão autenticada.
 */
export async function updateOrderDefaulter(
  input: UpdateOrderDefaulterInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: updateOrderDefaulterInputSchema,
    auth: "required",
    successMessage: "Situação de inadimplência atualizada.",
    revalidateTags: ["orders"],
    run: ({ order_id, defaulter }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>("/order/update-defaulter", {
        method: "POST",
        body: { order_id, defaulter },
        token,
      }).then(() => null),
  });
}
