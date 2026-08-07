"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CheckoutResponseDto, CheckoutResultDto } from "@/lib/api/dto";
import { setSessionToken } from "@/lib/api/session";
import {
  checkoutInputSchema,
  type CheckoutInput,
} from "@/schemas/checkout/checkout.schema";

/**
 * `POST /v1/checkout` — contrata a bolsa: cria a conta (quando não há sessão) e a cobrança.
 *
 * `auth: "optional"` porque a mesma rota atende os dois públicos. Quando a resposta traz
 * `accessToken`, a conta nasceu agora e a sessão é gravada aqui — é o que leva o aluno
 * autenticado direto para o acompanhamento do pagamento, sem passar por um login com a
 * senha provisória.
 */
export async function createCheckout(
  input: CheckoutInput,
): Promise<ActionResult<CheckoutResultDto>> {
  return executeAction({
    input,
    schema: checkoutInputSchema,
    auth: "optional",
    successMessage: "Cobrança gerada.",
    revalidateTags: ["orders", "payments"],
    run: async (payload, { token }) => {
      const response = await apiRequest<CheckoutResponseDto>("/checkout", {
        method: "POST",
        body: payload,
        token,
      });

      if (response.checkout.accessToken) {
        await setSessionToken(response.checkout.accessToken);
      }

      return response.checkout;
    },
  });
}
