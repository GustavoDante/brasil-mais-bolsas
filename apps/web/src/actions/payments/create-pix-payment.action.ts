"use server";

import { CreatePixPaymentSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PaymentResultDto } from "@/lib/api/dto";

const schema = CreatePixPaymentSchema;

export type CreatePixPaymentInput = z.infer<typeof schema>;

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
    schema,
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
