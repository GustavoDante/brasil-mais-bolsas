"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";
import {
  getCallInputSchema,
  type GetCallInput,
} from "@/schemas/calls/get-call.schema";

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
    schema: getCallInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; call: CallDto }>(
        `/calls/id/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.call),
  });
}
