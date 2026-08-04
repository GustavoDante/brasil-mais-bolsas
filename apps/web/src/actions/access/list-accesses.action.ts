"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AccessDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListAccessesInput = z.infer<typeof schema>;

/**
 * `GET /v1/access` — Lista os acessos registrados.
 *
 * Requer sessão autenticada.
 */
export async function listAccesses(): Promise<ActionResult<AccessDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; accesses: AccessDto[] }>("/access", {
        token,
      }).then((response) => response.accesses),
  });
}
