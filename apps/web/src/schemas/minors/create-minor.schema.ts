/**
 * Schema de entrada de `create-minor` (módulo minors).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateMinorSchema } from "@repo/contracts";

export const createMinorInputSchema = CreateMinorSchema;

export type CreateMinorInput = z.infer<typeof createMinorInputSchema>;
