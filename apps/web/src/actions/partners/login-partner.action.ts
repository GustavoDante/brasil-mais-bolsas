"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PartnerDto } from "@/lib/api/dto";
import {
  loginPartnerInputSchema,
  type LoginPartnerInput,
} from "@/schemas/partners/login-partner.schema";

// Credenciais no corpo + recorte por periodo na query string.

/**
 * `POST /v1/partners/login` — Autentica um parceiro pelo código e senha.
 */
export async function loginPartner(
  input: LoginPartnerInput,
): Promise<ActionResult<PartnerDto>> {
  return executeAction({
    input,
    schema: loginPartnerInputSchema,
    auth: "none",
    run: ({ code, password, startDate, endDate }) =>
      apiRequest<{ ok: boolean; partner: PartnerDto }>("/partners/login", {
        method: "POST",
        body: { code, password },
        query: { startDate, endDate },
        revalidate: false,
      }).then((response) => response.partner),
  });
}
