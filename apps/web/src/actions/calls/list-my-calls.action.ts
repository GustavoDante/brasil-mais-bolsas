"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";
import { listMyCallsInputSchema } from "@/schemas/calls/list-my-calls.schema";

/**
 * `GET /v1/calls/user` — Lista as ligações do usuário autenticado.
 *
 * Requer sessão autenticada.
 */
export async function listMyCalls(): Promise<ActionResult<CallDto[]>> {
  return executeAction({
    input: {},
    schema: listMyCallsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; calls: CallDto[] }>("/calls/user", {
        token
      }).then((response) => response.calls)
  });
}
