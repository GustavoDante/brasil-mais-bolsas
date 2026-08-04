"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";
import {
  createCallInputSchema,
  type CreateCallInput,
} from "@/schemas/calls/create-call.schema";

/**
 * `POST /v1/calls` — Registra uma ligação para um usuário.
 *
 * Requer sessão autenticada.
 */
export async function createCall(
  input: CreateCallInput,
): Promise<ActionResult<CallDto>> {
  return executeAction({
    input,
    schema: createCallInputSchema,
    auth: "required",
    successMessage: "Ligação registrada.",
    revalidateTags: ["calls"],
    run: ({ receiver_id, description, to_return }, { token }) =>
      apiRequest<{ ok: boolean; message: string; call: CallDto }>("/calls", {
        method: "POST",
        body: { receiver_id, description, to_return },
        token,
      }).then((response) => response.call),
  });
}
