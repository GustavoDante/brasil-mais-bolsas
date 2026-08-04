"use server";

import { CreateCreditCardPaymentSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PaymentResultDto } from "@/lib/api/dto";

const schema = CreateCreditCardPaymentSchema;

export type CreateCreditCardPaymentInput = z.infer<typeof schema>;

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
    schema,
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
