"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PaymentDto, PaymentResponseDto } from "@/lib/api/dto";
import {
  getPaymentInputSchema,
  type GetPaymentInput,
} from "@/schemas/payments/get-payment.schema";

/**
 * `GET /v1/payment/:id` — Consulta um pagamento do próprio usuário.
 *
 * É o que a tela de acompanhamento consulta enquanto espera a confirmação do PIX ou do
 * boleto, que chega pelo webhook do Asaas. Requer sessão autenticada.
 */
export async function getPayment(
  input: GetPaymentInput,
): Promise<ActionResult<PaymentDto>> {
  return executeAction({
    input,
    schema: getPaymentInputSchema,
    auth: "required",
    run: async ({ id }, { token }) => {
      const response = await apiRequest<PaymentResponseDto>(`/payment/${id}`, {
        token,
      });

      return response.payment;
    },
  });
}
