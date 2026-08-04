/**
 * Schema de entrada de `list-scholarship-cities` (módulo scholarships).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";

export const listScholarshipCitiesInputSchema = z.object({});

export type ListScholarshipCitiesInput = z.infer<
  typeof listScholarshipCitiesInputSchema
>;
