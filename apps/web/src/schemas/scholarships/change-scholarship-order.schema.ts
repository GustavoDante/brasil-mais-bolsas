/**
 * Schema de entrada de `change-scholarship-order` (módulo scholarships).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { ChangeScholarshipOrderSchema } from "@repo/contracts";

export const changeScholarshipOrderInputSchema = ChangeScholarshipOrderSchema;

export type ChangeScholarshipOrderInput = z.infer<
  typeof changeScholarshipOrderInputSchema
>;
