/**
 * Schema de entrada de `get-scholarship-students-count` (módulo scholarships).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zId } from "@repo/contracts";

export const getScholarshipStudentsCountInputSchema = z.object({
  id: zId("Informe o id da bolsa"),
});

export type GetScholarshipStudentsCountInput = z.infer<
  typeof getScholarshipStudentsCountInputSchema
>;
