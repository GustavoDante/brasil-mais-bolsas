/**
 * Schema de entrada de `create-scholarship-value` (módulo scholarships).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateNewScholarshipValueSchema } from "@repo/contracts";

export const createScholarshipValueInputSchema = CreateNewScholarshipValueSchema;

export type CreateScholarshipValueInput = z.infer<
  typeof createScholarshipValueInputSchema
>;
