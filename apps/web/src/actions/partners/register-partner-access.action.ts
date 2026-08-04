"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  registerPartnerAccessInputSchema,
  type RegisterPartnerAccessInput,
} from "@/schemas/partners/register-partner-access.schema";

/**
 * `POST /v1/partners/access` — Registra o acesso de um visitante que chegou pelo código do parceiro.
 */
export async function registerPartnerAccess(
  input: RegisterPartnerAccessInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: registerPartnerAccessInputSchema,
    auth: "none",
    run: ({ partner_code }) =>
      apiRequest<{ ok: boolean; message?: string }>("/partners/access", {
        method: "POST",
        body: { partner_code },
      }).then(() => null),
  });
}
