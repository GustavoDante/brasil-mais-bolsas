"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { MinorDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListMinorsInput = z.infer<typeof schema>;

/**
 * `GET /v1/minors` — Lista os dependentes cadastrados.
 *
 * Requer sessão autenticada.
 */
export async function listMinors(): Promise<ActionResult<MinorDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; minors: MinorDto[] }>("/minors", {
        token,
      }).then((response) => response.minors),
  });
}
