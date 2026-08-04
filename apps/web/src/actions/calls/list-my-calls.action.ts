"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListMyCallsInput = z.infer<typeof schema>;

/**
 * `GET /v1/calls/user` — Lista as ligações do usuário autenticado.
 *
 * Requer sessão autenticada.
 */
export async function listMyCalls(): Promise<ActionResult<CallDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; calls: CallDto[] }>("/calls/user", {
        token,
      }).then((response) => response.calls),
  });
}
