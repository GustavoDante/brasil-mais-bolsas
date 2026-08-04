"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { IndicationCallDto } from "@/lib/api/dto";
import {
  createIndicationCallInputSchema,
  type CreateIndicationCallInput,
} from "@/schemas/indications/create-indication-call.schema";

/**
 * `POST /v1/indications/call` — Registra uma ligação feita para uma indicação (admin).
 *
 * Requer sessão autenticada.
 */
export async function createIndicationCall(
  input: CreateIndicationCallInput,
): Promise<ActionResult<IndicationCallDto>> {
  return executeAction({
    input,
    schema: createIndicationCallInputSchema,
    auth: "required",
    successMessage: "Ligação registrada.",
    revalidateTags: ["indications"],
    run: ({ indication_id, receiver_id, description, to_return }, { token }) =>
      apiRequest<{ ok: boolean; message: string; call: IndicationCallDto }>(
        "/indications/call",
        {
          method: "POST",
          body: { indication_id, receiver_id, description, to_return },
          token,
        },
      ).then((response) => response.call),
  });
}
