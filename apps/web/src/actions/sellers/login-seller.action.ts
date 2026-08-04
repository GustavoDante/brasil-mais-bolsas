"use server";

import { SellerLoginSchema, SellersQuerySchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { SellerDto } from "@/lib/api/dto";

// Credenciais no corpo + recorte por periodo na query string.
const schema = SellerLoginSchema.extend(SellersQuerySchema.shape);

export type LoginSellerInput = z.infer<typeof schema>;

/**
 * `POST /v1/sellers/login` — Autentica um vendedor por e-mail e senha.
 */
export async function loginSeller(
  input: LoginSellerInput,
): Promise<ActionResult<SellerDto>> {
  return executeAction({
    input,
    schema,
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
