"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { IndicationDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListIndicationsInput = z.infer<typeof schema>;

/**
 * `GET /v1/indications` — Lista todas as indicações (admin).
 *
 * Requer sessão autenticada.
 */
export async function listIndications(): Promise<
  ActionResult<IndicationDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; indications: IndicationDto[] }>(
        "/indications",
        { token },
      ).then((response) => response.indications),
  });
}
