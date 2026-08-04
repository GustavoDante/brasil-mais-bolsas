"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PaymentResultDto } from "@/lib/api/dto";
import {
  createInterestPaymentInputSchema,
  type CreateInterestPaymentInput,
} from "@/schemas/payments/create-interest-payment.schema";

/**
 * `POST /v1/payment/create-interest-payment` — Gera a cobrança de juros/renovação de uma bolsa.
 *
 * Requer sessão autenticada.
 */
export async function createInterestPayment(
  input: CreateInterestPaymentInput,
): Promise<ActionResult<PaymentResultDto>> {
  return executeAction({
    input,
    schema: createInterestPaymentInputSchema,
    auth: "required",
    successMessage: "Cobrança gerada.",
    revalidateTags: ["orders", "payments"],
    run: ({ scholarship_id }, { token }) =>
      apiRequest<PaymentResultDto>("/payment/create-interest-payment", {
        method: "POST",
        body: { scholarship_id },
        token,
      }),
  });
}
