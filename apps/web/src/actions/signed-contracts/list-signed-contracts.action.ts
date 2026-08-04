"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SignedContractDto } from "@/lib/api/dto";
import { listSignedContractsInputSchema } from "@/schemas/signed-contracts/list-signed-contracts.schema";

/**
 * `GET /v1/signed-contracts` — Lista os contratos assinados.
 *
 * Requer sessão autenticada.
 */
export async function listSignedContracts(): Promise<
  ActionResult<SignedContractDto[]>
> {
  return executeAction({
    input: {},
    schema: listSignedContractsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; items: SignedContractDto[] }>(
        "/signed-contracts",
        { token },
      ).then((response) => response.items)
  });
}
