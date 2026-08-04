"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListStudentsReportInput = z.infer<typeof schema>;

/**
 * `GET /v1/reports/students` — Relatório de alunos.
 *
 * Requer sessão autenticada.
 */
export async function listStudentsReport(): Promise<
  ActionResult<ReportRowDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; students: ReportRowDto[] }>(
        "/reports/students",
        { token, revalidate: false },
      ).then((response) => response.students),
  });
}
