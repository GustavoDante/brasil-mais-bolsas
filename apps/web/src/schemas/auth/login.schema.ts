/**
 * Schema de entrada de `login` (módulo auth).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { LoginSchema } from "@repo/contracts";

export const loginInputSchema = LoginSchema;

export type LoginInput = z.infer<typeof loginInputSchema>;
