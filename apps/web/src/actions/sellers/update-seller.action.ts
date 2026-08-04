"use server";

import { UpdateSellerSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zId,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = UpdateSellerSchema.extend({ id: zId("Informe o id do vendedor") });

export type UpdateSellerInput = z.infer<typeof schema>;

/**
 * `PUT /v1/sellers/:id` — Atualiza um vendedor (admin).
 *
 * Requer sessão autenticada.
 */
export async function updateSeller(
  input: UpdateSellerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Vendedor atualizado.",
    revalidateTags: ["sellers"],
    run: ({ id, name, email, password }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/sellers/${encodeURIComponent(id)}`,
        { method: "PUT", body: { name, email, password }, token },
      ).then(() => null),
  });
}
