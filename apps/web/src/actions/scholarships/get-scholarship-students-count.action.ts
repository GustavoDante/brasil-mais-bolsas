"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  getScholarshipStudentsCountInputSchema,
  type GetScholarshipStudentsCountInput,
} from "@/schemas/scholarships/get-scholarship-students-count.schema";

/**
 * `GET /v1/scholarships/students_count/:id` — Quantidade de alunos de uma bolsa.
 *
 * Requer sessão autenticada.
 */
export async function getScholarshipStudentsCount(
  input: GetScholarshipStudentsCountInput,
): Promise<ActionResult<number>> {
  return executeAction({
    input,
    schema: getScholarshipStudentsCountInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; students_count: number }>(
        `/scholarships/students_count/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ).then((response) => response.students_count),
  });
}
