/**
 * Schema de entrada de `get-call` (módulo calls).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zId } from "@repo/contracts";

export const getCallInputSchema = z.object({
  id: zId("Informe o id da ligação"),
});

export type GetCallInput = z.infer<typeof getCallInputSchema>;
