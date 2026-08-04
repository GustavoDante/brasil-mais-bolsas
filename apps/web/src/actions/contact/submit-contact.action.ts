"use server";

import { ContactRequestSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = ContactRequestSchema;

export type SubmitContactInput = z.infer<typeof schema>;

/**
 * `POST /v1/contact` — Envia uma mensagem do formulário de contato.
 */
export async function submitContact(
  input: SubmitContactInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    successMessage: "Mensagem enviada com sucesso.",
    run: ({ name, email, phone, subject, message }) =>
      apiRequest<{ ok: boolean; message?: string }>("/contact", {
        method: "POST",
        body: { name, email, phone, subject, message },
      }).then(() => null),
  });
}
