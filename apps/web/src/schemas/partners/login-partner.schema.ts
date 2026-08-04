/**
 * Schema de entrada de `login-partner` (módulo partners).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { PartnerLoginSchema, PartnersQuerySchema } from "@repo/contracts";

export const loginPartnerInputSchema = PartnerLoginSchema.extend(PartnersQuerySchema.shape);

export type LoginPartnerInput = z.infer<typeof loginPartnerInputSchema>;
