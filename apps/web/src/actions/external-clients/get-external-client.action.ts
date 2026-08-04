"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ExternalClientDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id do cliente"),
});

export type GetExternalClientInput = z.infer<typeof schema>;

/**
 * `GET /v1/external-clients/:id` — Busca um cliente do gateway pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getExternalClient(
  input: GetExternalClientInput,
): Promise<ActionResult<ExternalClientDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; client: ExternalClientDto }>(
        `/external-clients/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.client),
  });
}
