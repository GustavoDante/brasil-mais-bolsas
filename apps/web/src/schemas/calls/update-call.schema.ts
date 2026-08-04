/**
 * Schema de entrada de `update-call` (módulo calls).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { UpdateCallSchema, zId } from "@repo/contracts";

export const updateCallInputSchema = UpdateCallSchema.extend({ id: zId("Informe o id da ligação") });

export type UpdateCallInput = z.infer<typeof updateCallInputSchema>;
