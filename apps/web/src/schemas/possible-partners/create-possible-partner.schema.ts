/**
 * Schema de entrada de `create-possible-partner` (módulo possible-partners).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreatePossiblePartnerSchema } from "@repo/contracts";

export const createPossiblePartnerInputSchema = CreatePossiblePartnerSchema;

export type CreatePossiblePartnerInput = z.infer<
  typeof createPossiblePartnerInputSchema
>;
