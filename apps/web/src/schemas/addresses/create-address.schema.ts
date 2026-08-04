/**
 * Schema de entrada de `create-address` (módulo addresses).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateAddressStandaloneSchema } from "@repo/contracts";

export const createAddressInputSchema = CreateAddressStandaloneSchema;

export type CreateAddressInput = z.infer<typeof createAddressInputSchema>;
