"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { OrdersRenewalSummaryDto } from "@/lib/api/dto";
import { runOrdersRenewalInputSchema } from "@/schemas/jobs/run-orders-renewal.schema";

/**
 * `POST /v1/jobs/orders-renewal/run` — Executa a renovação de pedidos agora e devolve o resumo (admin).
 *
 * Requer sessão autenticada.
 */
export async function runOrdersRenewal(): Promise<
  ActionResult<OrdersRenewalSummaryDto>
> {
  return executeAction({
    input: {},
    schema: runOrdersRenewalInputSchema,
    auth: "required",
    successMessage: "Renovação executada.",
    revalidateTags: ["orders"],
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; summary: OrdersRenewalSummaryDto }>(
        "/jobs/orders-renewal/run",
        { method: "POST", token },
      ).then((response) => response.summary)
  });
}
