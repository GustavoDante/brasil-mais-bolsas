"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrderDto } from "@/lib/api/dto";
import {
  changeScholarshipOrderInputSchema,
  type ChangeScholarshipOrderInput,
} from "@/schemas/scholarships/change-scholarship-order.schema";

/**
 * `POST /v1/scholarships/change` — Troca a bolsa de um pedido (admin).
 *
 * Requer sessão autenticada.
 */
export async function changeScholarshipOrder(
  input: ChangeScholarshipOrderInput,
): Promise<ActionResult<OrderDto>> {
  return executeAction({
    input,
    schema: changeScholarshipOrderInputSchema,
    auth: "required",
    successMessage: "Bolsa do pedido alterada.",
    revalidateTags: ["orders", "scholarships"],
    run: ({ order_id, new_scholarship }, { token }) =>
      apiRequest<{ ok: boolean; order: OrderDto }>("/scholarships/change", {
        method: "POST",
        body: { order_id, new_scholarship },
        token,
      }).then((response) => response.order),
  });
}
