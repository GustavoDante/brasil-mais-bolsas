/**
 * Schema de entrada de `search-courses` (módulo courses).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zOptionalText } from "@repo/contracts";

export const searchCoursesInputSchema = z.object({
  term: zOptionalText(),
});

export type SearchCoursesInput = z.infer<typeof searchCoursesInputSchema>;
