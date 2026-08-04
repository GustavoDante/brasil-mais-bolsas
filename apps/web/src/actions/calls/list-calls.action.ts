"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";
import { listCallsInputSchema } from "@/schemas/calls/list-calls.schema";

/**
 * `GET /v1/calls` — Lista todas as ligações (admin).
 *
 * Requer sessão autenticada.
 */
export async function listCalls(): Promise<ActionResult<CallDto[]>> {
  return executeAction({
    input: {},
    schema: listCallsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; calls: CallDto[] }>("/calls", { token }).then(
        (response) => response.calls,
      )
  });
}
