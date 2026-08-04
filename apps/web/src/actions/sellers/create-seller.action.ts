"use server";

import { CreateSellerSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = CreateSellerSchema;

export type CreateSellerInput = z.infer<typeof schema>;

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
    schema,
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
