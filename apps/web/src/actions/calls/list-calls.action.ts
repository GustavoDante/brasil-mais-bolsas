"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CallDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListCallsInput = z.infer<typeof schema>;

/**
 * `GET /v1/calls` — Lista todas as ligações (admin).
 *
 * Requer sessão autenticada.
 */
export async function listCalls(): Promise<ActionResult<CallDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; calls: CallDto[] }>("/calls", { token }).then(
        (response) => response.calls,
      ),
  });
}
