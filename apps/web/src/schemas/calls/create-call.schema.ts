/**
 * Schema de entrada de `create-call` (módulo calls).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateCallSchema } from "@repo/contracts";

export const createCallInputSchema = CreateCallSchema;

export type CreateCallInput = z.infer<typeof createCallInputSchema>;
