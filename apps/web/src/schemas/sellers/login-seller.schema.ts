/**
 * Schema de entrada de `login-seller` (módulo sellers).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { SellerLoginSchema, SellersQuerySchema } from "@repo/contracts";

export const loginSellerInputSchema = SellerLoginSchema.extend(SellersQuerySchema.shape);

export type LoginSellerInput = z.infer<typeof loginSellerInputSchema>;
