/**
 * Schema de entrada de `update-order-defaulter` (módulo orders).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { UpdateOrderDefaulterSchema } from "@repo/contracts";

export const updateOrderDefaulterInputSchema = UpdateOrderDefaulterSchema;

export type UpdateOrderDefaulterInput = z.infer<
  typeof updateOrderDefaulterInputSchema
>;
