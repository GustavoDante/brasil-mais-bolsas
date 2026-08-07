/**
 * Schema de entrada de `get-payment` (módulo payments).
 *
 * Path param de rota de leitura: entrada exclusiva do frontend, por isso o objeto é
 * declarado aqui a partir do bloco `zId` do contrato.
 */
import { z } from "zod";
import { PaymentIdParamSchema } from "@repo/contracts";

export const getPaymentInputSchema = PaymentIdParamSchema;

export type GetPaymentInput = z.infer<typeof getPaymentInputSchema>;
