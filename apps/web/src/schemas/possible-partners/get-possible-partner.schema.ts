/**
 * Schema de entrada de `get-possible-partner` (módulo possible-partners).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zId } from "@repo/contracts";

export const getPossiblePartnerInputSchema = z.object({
  id: zId("Informe o id do possível parceiro"),
});

export type GetPossiblePartnerInput = z.infer<
  typeof getPossiblePartnerInputSchema
>;
