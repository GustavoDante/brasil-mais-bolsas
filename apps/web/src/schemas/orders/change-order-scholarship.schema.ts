/**
 * Schema de entrada de `change-order-scholarship` (módulo orders).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { ChangeOrderScholarshipSchema } from "@repo/contracts";

export const changeOrderScholarshipInputSchema = ChangeOrderScholarshipSchema;

export type ChangeOrderScholarshipInput = z.infer<
  typeof changeOrderScholarshipInputSchema
>;
