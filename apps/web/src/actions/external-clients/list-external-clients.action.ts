"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ExternalClientDto } from "@/lib/api/dto";
import { listExternalClientsInputSchema } from "@/schemas/external-clients/list-external-clients.schema";

/**
 * `GET /v1/external-clients` — Lista os clientes do gateway.
 *
 * Requer sessão autenticada.
 */
export async function listExternalClients(): Promise<
  ActionResult<ExternalClientDto[]>
> {
  return executeAction({
    input: {},
    schema: listExternalClientsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; clients: ExternalClientDto[] }>(
        "/external-clients",
        { token },
      ).then((response) => response.clients)
  });
}
