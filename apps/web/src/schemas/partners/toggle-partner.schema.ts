/**
 * Schema de entrada de `toggle-partner` (módulo partners).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zId } from "@repo/contracts";

export const togglePartnerInputSchema = z.object({
  id: zId("Informe o id do parceiro"),
});

export type TogglePartnerInput = z.infer<typeof togglePartnerInputSchema>;
