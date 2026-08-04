"use server";

import { CreateOrderSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = CreateOrderSchema;

export type CreateOrderInput = z.infer<typeof schema>;

/**
 * `POST /v1/order` — Cria um pedido para uma bolsa.
 *
 * Requer sessão autenticada.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Pedido criado.",
    revalidateTags: ["orders"],
    run: ({ user_id, scholarship_id, is_renew }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>("/order", {
        method: "POST",
        body: { user_id, scholarship_id, is_renew },
        token,
      }).then(() => null),
  });
}
