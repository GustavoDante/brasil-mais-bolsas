"use server";

import { CreateSignedContractSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SignedContractDto } from "@/lib/api/dto";

const schema = CreateSignedContractSchema;

export type CreateSignedContractInput = z.infer<typeof schema>;

/**
 * `POST /v1/signed-contracts` — Registra o aceite de contrato de uma bolsa.
 */
export async function createSignedContract(
  input: CreateSignedContractInput,
): Promise<ActionResult<SignedContractDto>> {
  return executeAction({
    input,
    schema,
    auth: "optional",
    successMessage: "Contrato assinado.",
    revalidateTags: ["signed-contracts"],
    run: ({ ip, isMobile, user_id, scholarship_id, deviceInfo }, { token }) =>
      apiRequest<{ ok: boolean; rec: SignedContractDto }>("/signed-contracts", {
        method: "POST",
        body: { ip, isMobile, user_id, scholarship_id, deviceInfo },
        token,
      }).then((response) => response.rec),
  });
}
