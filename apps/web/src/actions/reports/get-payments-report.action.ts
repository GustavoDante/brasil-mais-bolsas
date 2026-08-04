"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";
import {
  getPaymentsReportInputSchema,
  type GetPaymentsReportInput,
} from "@/schemas/reports/get-payments-report.schema";

/**
 * `GET /v1/reports/payments` — Relatório de pagamentos de um pedido.
 *
 * Requer sessão autenticada.
 */
export async function getPaymentsReport(
  input: GetPaymentsReportInput,
): Promise<ActionResult<ReportRowDto[]>> {
  return executeAction({
    input,
    schema: getPaymentsReportInputSchema,
    auth: "required",
    run: ({ order_id }, { token }) =>
      apiRequest<{ ok: boolean; payments: ReportRowDto[] }>(
        "/reports/payments",
        { query: { order_id }, token, revalidate: false },
      ).then((response) => response.payments),
  });
}
