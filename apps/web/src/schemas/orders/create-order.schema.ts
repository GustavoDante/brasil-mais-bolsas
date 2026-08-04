/**
 * Schema de entrada de `create-order` (módulo orders).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateOrderSchema } from "@repo/contracts";

export const createOrderInputSchema = CreateOrderSchema;

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
