"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ExternalClientDto } from "@/lib/api/dto";
import {
  getExternalClientInputSchema,
  type GetExternalClientInput,
} from "@/schemas/external-clients/get-external-client.schema";

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
    schema: getExternalClientInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; client: ExternalClientDto }>(
        `/external-clients/${encodeURIComponent(id)}`,
        { token },
      ).then((response) => response.client),
  });
}
