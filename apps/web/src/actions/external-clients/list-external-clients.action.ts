"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ExternalClientDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListExternalClientsInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; clients: ExternalClientDto[] }>(
        "/external-clients",
        { token },
      ).then((response) => response.clients),
  });
}
