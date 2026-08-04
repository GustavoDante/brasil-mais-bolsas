/**
 * Schema de entrada de `get-order-voucher` (módulo orders).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { OrderVoucherQuerySchema } from "@repo/contracts";

export const getOrderVoucherInputSchema = OrderVoucherQuerySchema;

export type GetOrderVoucherInput = z.infer<typeof getOrderVoucherInputSchema>;
