"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SellerDto } from "@/lib/api/dto";
import {
  loginSellerInputSchema,
  type LoginSellerInput,
} from "@/schemas/sellers/login-seller.schema";

// Credenciais no corpo + recorte por periodo na query string.

/**
 * `POST /v1/sellers/login` — Autentica um vendedor por e-mail e senha.
 */
export async function loginSeller(
  input: LoginSellerInput,
): Promise<ActionResult<SellerDto>> {
  return executeAction({
    input,
    schema: loginSellerInputSchema,
    auth: "none",
    run: ({ email, password, startDate, endDate }) =>
      apiRequest<{ ok: boolean; seller: SellerDto }>("/sellers/login", {
        method: "POST",
        body: { email, password },
        query: { startDate, endDate },
        revalidate: false,
      }).then((response) => response.seller),
  });
}
