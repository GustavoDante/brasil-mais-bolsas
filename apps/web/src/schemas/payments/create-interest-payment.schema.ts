/**
 * Schema de entrada de `create-interest-payment` (módulo payments).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateInterestPaymentSchema } from "@repo/contracts";

export const createInterestPaymentInputSchema = CreateInterestPaymentSchema;

export type CreateInterestPaymentInput = z.infer<
  typeof createInterestPaymentInputSchema
>;
