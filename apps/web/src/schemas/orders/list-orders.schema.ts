/**
 * Schema de entrada de `list-orders` (módulo orders).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { OrderListQuerySchema } from "@repo/contracts";

export const listOrdersInputSchema = OrderListQuerySchema;

export type ListOrdersInput = z.infer<typeof listOrdersInputSchema>;
