/**
 * Schema de entrada de `create-partner` (módulo partners).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreatePartnerSchema } from "@repo/contracts";

export const createPartnerInputSchema = CreatePartnerSchema;

export type CreatePartnerInput = z.infer<typeof createPartnerInputSchema>;
