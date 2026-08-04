"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";
import {
  changeOrderScholarshipInputSchema,
  type ChangeOrderScholarshipInput,
} from "@/schemas/orders/change-order-scholarship.schema";

/**
 * `PUT /v1/order/change` — Troca a bolsa de um pedido.
 *
 * Requer sessão autenticada.
 */
export async function changeOrderScholarship(
  input: ChangeOrderScholarshipInput,
): Promise<ActionResult<OrderDto>> {
  return executeAction({
    input,
    schema: changeOrderScholarshipInputSchema,
    auth: "required",
    successMessage: "Bolsa do pedido alterada.",
    revalidateTags: ["orders"],
    run: ({ orderId, newScholarshipId }, { token }) =>
      apiRequest<{ ok: boolean; order: OrderDto }>("/order/change", {
        method: "PUT",
        body: { orderId, newScholarshipId },
        token,
      }).then((response) => response.order),
  });
}
