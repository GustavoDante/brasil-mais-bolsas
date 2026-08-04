/**
 * Schema de entrada de `get-institution` (módulo institutions).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zId } from "@repo/contracts";

export const getInstitutionInputSchema = z.object({
  id: zId("Informe o id da instituição"),
});

export type GetInstitutionInput = z.infer<typeof getInstitutionInputSchema>;
