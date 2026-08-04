"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { IndicationDto } from "@/lib/api/dto";
import { listIndicationsInputSchema } from "@/schemas/indications/list-indications.schema";

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
    schema: listIndicationsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; indications: IndicationDto[] }>(
        "/indications",
        { token },
      ).then((response) => response.indications)
  });
}
