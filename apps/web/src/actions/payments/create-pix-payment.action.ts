"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PaymentResultDto } from "@/lib/api/dto";
import {
  createPixPaymentInputSchema,
  type CreatePixPaymentInput,
} from "@/schemas/payments/create-pix-payment.schema";

/**
 * `POST /v1/payment/asaas/pix` — Cria um pagamento via PIX e devolve o QR Code.
 *
 * Requer sessão autenticada.
 */
export async function createPixPayment(
  input: CreatePixPaymentInput,
): Promise<ActionResult<PaymentResultDto>> {
  return executeAction({
    input,
    schema: createPixPaymentInputSchema,
    auth: "required",
    successMessage: "PIX gerado.",
    revalidateTags: ["orders", "payments"],
    run: ({ scholarship_id, renew }, { token }) =>
      apiRequest<PaymentResultDto>("/payment/asaas/pix", {
        method: "POST",
        body: { scholarship_id, renew },
        token,
      }),
  });
}
