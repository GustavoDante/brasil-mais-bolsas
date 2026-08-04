/**
 * Schema de entrada de `search-scholarship-courses` (módulo scholarships).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zOptionalText } from "@repo/contracts";

export const searchScholarshipCoursesInputSchema = z.object({
  term: zOptionalText(),
});

export type SearchScholarshipCoursesInput = z.infer<
  typeof searchScholarshipCoursesInputSchema
>;
