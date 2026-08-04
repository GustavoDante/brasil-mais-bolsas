"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da bolsa"),
});

export type GetScholarshipStudentsCountInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; students_count: number }>(
        `/scholarships/students_count/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ).then((response) => response.students_count),
  });
}
