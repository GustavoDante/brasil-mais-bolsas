/**
 * Schema de entrada de `create-course-category` (módulo course-categories).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateCourseCategorySchema } from "@repo/contracts";

export const createCourseCategoryInputSchema = CreateCourseCategorySchema;

export type CreateCourseCategoryInput = z.infer<
  typeof createCourseCategoryInputSchema
>;
