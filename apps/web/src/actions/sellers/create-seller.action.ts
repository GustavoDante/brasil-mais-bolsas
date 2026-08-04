"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  createSellerInputSchema,
  type CreateSellerInput,
} from "@/schemas/sellers/create-seller.schema";

/**
 * `POST /v1/sellers` — Cria um vendedor (admin).
 *
 * Requer sessão autenticada.
 */
export async function createSeller(
  input: CreateSellerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: createSellerInputSchema,
    auth: "required",
    successMessage: "Vendedor criado.",
    revalidateTags: ["sellers"],
    run: ({ name, email, password }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>("/sellers", {
        method: "POST",
        body: { name, email, password },
        token,
      }).then(() => null),
  });
}
