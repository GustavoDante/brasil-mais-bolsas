"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da ligação"),
});

export type GetCallInput = z.infer<typeof schema>;

/**
 * `GET /v1/calls/id/:id` — Busca uma ligação pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getCall(
  input: GetCallInput,
): Promise<ActionResult<CallDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; call: CallDto }>(
        `/calls/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.call),
  });
}
