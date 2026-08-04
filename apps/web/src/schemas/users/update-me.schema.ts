/**
 * Schema de entrada de `update-me` (módulo users).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { UpdateUserSchema } from "@repo/contracts";

export const updateMeInputSchema = UpdateUserSchema;

export type UpdateMeInput = z.infer<typeof updateMeInputSchema>;
