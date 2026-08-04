"use server";

import { PartnerLoginSchema, PartnersQuerySchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PartnerDto } from "@/lib/api/dto";

// Credenciais no corpo + recorte por periodo na query string.
const schema = PartnerLoginSchema.extend(PartnersQuerySchema.shape);

export type LoginPartnerInput = z.infer<typeof schema>;

/**
 * `POST /v1/partners/login` — Autentica um parceiro pelo código e senha.
 */
export async function loginPartner(
  input: LoginPartnerInput,
): Promise<ActionResult<PartnerDto>> {
  return executeAction({
    input,
    schema,
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
