"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";
import {
  getImpactReportInputSchema,
  type GetImpactReportInput,
} from "@/schemas/reports/get-impact-report.schema";

/**
 * `GET /v1/reports/impact` — Relatório de impacto (bolsas) de uma instituição.
 *
 * Requer sessão autenticada.
 */
export async function getImpactReport(
  input: GetImpactReportInput,
): Promise<ActionResult<ReportRowDto[]>> {
  return executeAction({
    input,
    schema: getImpactReportInputSchema,
    auth: "required",
    run: ({ institution }, { token }) =>
      apiRequest<{ ok: boolean; scholarships: ReportRowDto[] }>(
        "/reports/impact",
        { query: { institution }, token, revalidate: false },
      ).then((response) => response.scholarships),
  });
}
