"use server";

import { UpdateCallSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zId,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";

const schema = UpdateCallSchema.extend({ id: zId("Informe o id da ligação") });

export type UpdateCallInput = z.infer<typeof schema>;

/**
 * `PATCH /v1/calls/:id` — Atualiza uma ligação.
 *
 * Requer sessão autenticada.
 */
export async function updateCall(
  input: UpdateCallInput,
): Promise<ActionResult<CallDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Ligação atualizada.",
    revalidateTags: ["calls"],
    run: ({ id, receiver_id, description, to_return }, { token }) =>
      apiRequest<{ ok: boolean; message: string; call: CallDto }>(
        `/calls/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: { receiver_id, description, to_return },
          token,
        },
      ).then((response) => response.call),
  });
}
