"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";
import { listDefaultersReportInputSchema } from "@/schemas/reports/list-defaulters-report.schema";

/**
 * `GET /v1/reports/students/defaulters` — Relatório de alunos inadimplentes.
 *
 * Requer sessão autenticada.
 */
export async function listDefaultersReport(): Promise<
  ActionResult<ReportRowDto[]>
> {
  return executeAction({
    input: {},
    schema: listDefaultersReportInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; students: ReportRowDto[] }>(
        "/reports/students/defaulters",
        { token, revalidate: false },
      ).then((response) => response.students)
  });
}
