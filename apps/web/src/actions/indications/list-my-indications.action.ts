"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { IndicationDto } from "@/lib/api/dto";
import { listMyIndicationsInputSchema } from "@/schemas/indications/list-my-indications.schema";

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
    schema: listMyIndicationsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; indications: IndicationDto[] }>(
        "/indications/user",
        { token },
      ).then((response) => response.indications)
  });
}
