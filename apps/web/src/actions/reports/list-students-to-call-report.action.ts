"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";
import { listStudentsToCallReportInputSchema } from "@/schemas/reports/list-students-to-call-report.schema";

/**
 * `GET /v1/reports/students/to_call` — Relatório de alunos a contatar.
 *
 * Requer sessão autenticada.
 */
export async function listStudentsToCallReport(): Promise<
  ActionResult<ReportRowDto[]>
> {
  return executeAction({
    input: {},
    schema: listStudentsToCallReportInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; students: ReportRowDto[] }>(
        "/reports/students/to_call",
        { token, revalidate: false },
      ).then((response) => response.students)
  });
}
