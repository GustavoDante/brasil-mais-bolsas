"use server";

import { RegisterAccessSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = RegisterAccessSchema;

export type RegisterPartnerAccessInput = z.infer<typeof schema>;

/**
 * `POST /v1/partners/access` — Registra o acesso de um visitante que chegou pelo código do parceiro.
 */
export async function registerPartnerAccess(
  input: RegisterPartnerAccessInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ partner_code }) =>
      apiRequest<{ ok: boolean; message?: string }>("/partners/access", {
        method: "POST",
        body: { partner_code },
      }).then(() => null),
  });
}
