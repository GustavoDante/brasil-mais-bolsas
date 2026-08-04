"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";
import { listCalledStudentsReportInputSchema } from "@/schemas/reports/list-called-students-report.schema";

/**
 * `GET /v1/reports/students/called` — Relatório de alunos já contatados.
 *
 * Requer sessão autenticada.
 */
export async function listCalledStudentsReport(): Promise<
  ActionResult<ReportRowDto[]>
> {
  return executeAction({
    input: {},
    schema: listCalledStudentsReportInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; students: ReportRowDto[] }>(
        "/reports/students/called",
        { token, revalidate: false },
      ).then((response) => response.students)
  });
}
