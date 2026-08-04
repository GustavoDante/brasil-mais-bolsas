/**
 * Schema de entrada de `create-indication` (módulo indications).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateIndicationSchema } from "@repo/contracts";

export const createIndicationInputSchema = CreateIndicationSchema;

export type CreateIndicationInput = z.infer<typeof createIndicationInputSchema>;
