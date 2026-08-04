"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipContractDto } from "@/lib/api/dto";
import {
  getScholarshipContractInputSchema,
  type GetScholarshipContractInput,
} from "@/schemas/scholarships/get-scholarship-contract.schema";

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
    schema: getScholarshipContractInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<ScholarshipContractDto>(
        `/scholarships/contract/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ),
  });
}
