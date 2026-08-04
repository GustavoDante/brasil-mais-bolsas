"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AccessDto } from "@/lib/api/dto";
import { listAccessesInputSchema } from "@/schemas/access/list-accesses.schema";

/**
 * `GET /v1/access` — Lista os acessos registrados.
 *
 * Requer sessão autenticada.
 */
export async function listAccesses(): Promise<ActionResult<AccessDto[]>> {
  return executeAction({
    input: {},
    schema: listAccessesInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; accesses: AccessDto[] }>("/access", {
        token
      }).then((response) => response.accesses)
  });
}
