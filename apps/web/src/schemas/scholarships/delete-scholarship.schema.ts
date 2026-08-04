/**
 * Schema de entrada de `delete-scholarship` (módulo scholarships).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zId } from "@repo/contracts";

export const deleteScholarshipInputSchema = z.object({
  id: zId("Informe o id da bolsa"),
});

export type DeleteScholarshipInput = z.infer<typeof deleteScholarshipInputSchema>;
