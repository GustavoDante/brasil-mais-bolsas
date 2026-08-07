/**
 * Schema de entrada de `checkout` (módulo checkout).
 *
 * É o contrato puro: o que a action manda é exatamente o que a API valida. O modelo do
 * formulário multi-step, com o tratamento de campo em branco, fica em
 * `checkout-form.schema.ts`.
 */
import { z } from "zod";
import { CheckoutSchema } from "@repo/contracts";

export const checkoutInputSchema = CheckoutSchema;

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
