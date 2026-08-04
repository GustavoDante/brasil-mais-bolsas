/**
 * Schema de entrada de `list-ordered-scholarships` (módulo scholarships).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zOptionalText, zStringArray } from "@repo/contracts";

export const listOrderedScholarshipsInputSchema = z.object({
  alreadyListed: zStringArray(),
  type: zOptionalText(),
  institution: zOptionalText(),
  city: zOptionalText(),
  category: zOptionalText(),
  course: zOptionalText(),
  showExpired: zOptionalText(),
  showInativas: zOptionalText(),
});

export type ListOrderedScholarshipsInput = z.infer<
  typeof listOrderedScholarshipsInputSchema
>;
