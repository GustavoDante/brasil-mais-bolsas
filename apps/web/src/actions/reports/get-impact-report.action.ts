"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalText,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ReportRowDto } from "@/lib/api/dto";

const schema = z.object({
  institution: zOptionalText(),
});

export type GetImpactReportInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ institution }, { token }) =>
      apiRequest<{ ok: boolean; scholarships: ReportRowDto[] }>(
        "/reports/impact",
        { query: { institution }, token, revalidate: false },
      ).then((response) => response.scholarships),
  });
}
