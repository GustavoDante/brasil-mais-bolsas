"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { IndicationDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListMyIndicationsInput = z.infer<typeof schema>;

/**
 * `GET /v1/indications/user` — Lista as indicações do usuário autenticado.
 *
 * Requer sessão autenticada.
 */
export async function listMyIndications(): Promise<
  ActionResult<IndicationDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; indications: IndicationDto[] }>(
        "/indications/user",
        { token },
      ).then((response) => response.indications),
  });
}
