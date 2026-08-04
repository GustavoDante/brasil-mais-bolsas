"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PaymentResultDto } from "@/lib/api/dto";
import {
  createCreditCardPaymentInputSchema,
  type CreateCreditCardPaymentInput,
} from "@/schemas/payments/create-credit-card-payment.schema";

/**
 * `POST /v1/payment/credit_card` — Cria um pagamento com cartão de crédito.
 *
 * Requer sessão autenticada.
 */
export async function createCreditCardPayment(
  input: CreateCreditCardPaymentInput,
): Promise<ActionResult<PaymentResultDto>> {
  return executeAction({
    input,
    schema: createCreditCardPaymentInputSchema,
    auth: "required",
    successMessage: "Pagamento processado.",
    revalidateTags: ["orders", "payments"],
    run: (
      {
        scholarship_id,
        installment_count,
        renew,
        creditCard,
        creditCardHolderInfo,
        remoteIp,
      },
      { token },
    ) =>
      apiRequest<PaymentResultDto>("/payment/credit_card", {
        method: "POST",
        body: {
          scholarship_id,
          installment_count,
          renew,
          creditCard,
          creditCardHolderInfo,
          remoteIp,
        },
        token,
      }),
  });
}
