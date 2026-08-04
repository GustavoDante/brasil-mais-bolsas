/**
 * Schema de entrada de `register-partner-access` (módulo partners).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { RegisterAccessSchema } from "@repo/contracts";

export const registerPartnerAccessInputSchema = RegisterAccessSchema;

export type RegisterPartnerAccessInput = z.infer<
  typeof registerPartnerAccessInputSchema
>;
