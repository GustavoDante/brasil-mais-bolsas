/**
 * Schema de entrada de `create-pix-payment` (módulo payments).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreatePixPaymentSchema } from "@repo/contracts";

export const createPixPaymentInputSchema = CreatePixPaymentSchema;

export type CreatePixPaymentInput = z.infer<typeof createPixPaymentInputSchema>;
