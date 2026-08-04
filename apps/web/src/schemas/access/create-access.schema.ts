/**
 * Schema de entrada de `create-access` (módulo access).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateAccessSchema } from "@repo/contracts";

export const createAccessInputSchema = CreateAccessSchema;

export type CreateAccessInput = z.infer<typeof createAccessInputSchema>;
