"use server";

import { UpdateOrderDefaulterSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = UpdateOrderDefaulterSchema;

export type UpdateOrderDefaulterInput = z.infer<typeof schema>;

/**
 * `POST /v1/order/update-defaulter` — Marca/desmarca um pedido como inadimplente (admin ou manager).
 *
 * Requer sessão autenticada.
 */
export async function updateOrderDefaulter(
  input: UpdateOrderDefaulterInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Situação de inadimplência atualizada.",
    revalidateTags: ["orders"],
    run: ({ order_id, defaulter }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>("/order/update-defaulter", {
        method: "POST",
        body: { order_id, defaulter },
        token,
      }).then(() => null),
  });
}
