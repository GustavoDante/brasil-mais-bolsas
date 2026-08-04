"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { IndicationDto } from "@/lib/api/dto";
import {
  createIndicationInputSchema,
  type CreateIndicationInput,
} from "@/schemas/indications/create-indication.schema";

/**
 * `POST /v1/indications` — Cria uma indicação em nome do usuário autenticado.
 *
 * Requer sessão autenticada.
 */
export async function createIndication(
  input: CreateIndicationInput,
): Promise<ActionResult<IndicationDto>> {
  return executeAction({
    input,
    schema: createIndicationInputSchema,
    auth: "required",
    successMessage: "Indicação enviada.",
    revalidateTags: ["indications"],
    run: ({ name, email, cell, city }, { token }) =>
      apiRequest<{ ok: boolean; message: string; indication: IndicationDto }>(
        "/indications",
        { method: "POST", body: { name, email, cell, city }, token },
      ).then((response) => response.indication),
  });
}
