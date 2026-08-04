"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ExternalClientDto } from "@/lib/api/dto";
import {
  createExternalClientInputSchema,
  type CreateExternalClientInput,
} from "@/schemas/external-clients/create-external-client.schema";

/**
 * `POST /v1/external-clients` — Cria o cliente correspondente no gateway de pagamento.
 *
 * Requer sessão autenticada.
 */
export async function createExternalClient(
  input: CreateExternalClientInput,
): Promise<ActionResult<ExternalClientDto>> {
  return executeAction({
    input,
    schema: createExternalClientInputSchema,
    auth: "required",
    successMessage: "Cliente criado.",
    revalidateTags: ["external-clients"],
    run: ({ id, name }, { token }) =>
      apiRequest<{ ok: boolean; client: ExternalClientDto }>(
        "/external-clients",
        { method: "POST", body: { id, name }, token },
      ).then((response) => response.client),
  });
}
