"use server";

import { CreatePossiblePartnerCallSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PossiblePartnerCallDto } from "@/lib/api/dto";

const schema = CreatePossiblePartnerCallSchema;

export type CreatePossiblePartnerCallInput = z.infer<typeof schema>;

/**
 * `POST /v1/possible-partners/call` — Registra uma ligação para um possível parceiro (admin).
 *
 * Requer sessão autenticada.
 */
export async function createPossiblePartnerCall(
  input: CreatePossiblePartnerCallInput,
): Promise<ActionResult<PossiblePartnerCallDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Ligação registrada.",
    revalidateTags: ["possible-partners"],
    run: (
      { possible_partner_id, receiver_id, description, to_return },
      { token },
    ) =>
      apiRequest<{
        ok: boolean;
        message: string;
        call: PossiblePartnerCallDto;
      }>("/possible-partners/call", {
        method: "POST",
        body: { possible_partner_id, receiver_id, description, to_return },
        token,
      }).then((response) => response.call),
  });
}
