"use server";

import { GeneralReportQuerySchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";

const schema = GeneralReportQuerySchema;

export type GetGeneralReportInput = z.infer<typeof schema>;

/**
 * `GET /v1/reports/general` — Relatório geral de pagamentos por instituição, curso e período.
 *
 * Requer sessão autenticada.
 */
export async function getGeneralReport(
  input: GetGeneralReportInput,
): Promise<ActionResult<ReportRowDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ institution, course, start_date, end_date }, { token }) =>
      apiRequest<{ ok: boolean; payments: ReportRowDto[] }>(
        "/reports/general",
        {
          query: { institution, course, start_date, end_date },
          token,
          revalidate: false,
        },
      ).then((response) => response.payments),
  });
}
