/**
 * Schema de entrada de `create-faq` (módulo faq).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateFaqSchema } from "@repo/contracts";

export const createFaqInputSchema = CreateFaqSchema;

export type CreateFaqInput = z.infer<typeof createFaqInputSchema>;
