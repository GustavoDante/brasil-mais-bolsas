/**
 * Schema de entrada de `update-seller` (módulo sellers).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { UpdateSellerSchema, zId } from "@repo/contracts";

export const updateSellerInputSchema = UpdateSellerSchema.extend({ id: zId("Informe o id do vendedor") });

export type UpdateSellerInput = z.infer<typeof updateSellerInputSchema>;
