"use server";

import { RenewalsReportQuerySchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";

const schema = RenewalsReportQuerySchema;

export type ListRenewalsReportInput = z.infer<typeof schema>;

/**
 * `GET /v1/reports/students/renewals` — Relatório de renovações previstas para os próximos dias.
 *
 * Requer sessão autenticada.
 */
export async function listRenewalsReport(
  input: ListRenewalsReportInput,
): Promise<ActionResult<ReportRowDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ days }, { token }) =>
      apiRequest<{ ok: boolean; students: ReportRowDto[] }>(
        "/reports/students/renewals",
        { query: { days }, token, revalidate: false },
      ).then((response) => response.students),
  });
}
