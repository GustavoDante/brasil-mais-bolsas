"use server";

import { CreateCallSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";

const schema = CreateCallSchema;

export type CreateCallInput = z.infer<typeof schema>;

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
    schema,
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
