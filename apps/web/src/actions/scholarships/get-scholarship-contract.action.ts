"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipContractDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da bolsa"),
});

export type GetScholarshipContractInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/contract/:id` — Dados do contrato de uma bolsa para o usuário autenticado.
 *
 * Requer sessão autenticada.
 */
export async function getScholarshipContract(
  input: GetScholarshipContractInput,
): Promise<ActionResult<ScholarshipContractDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<ScholarshipContractDto>(
        `/scholarships/contract/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ),
  });
}
