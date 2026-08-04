"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SignedContractDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListSignedContractsInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; items: SignedContractDto[] }>(
        "/signed-contracts",
        { token },
      ).then((response) => response.items),
  });
}
