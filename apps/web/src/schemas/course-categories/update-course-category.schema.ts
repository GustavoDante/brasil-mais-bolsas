/**
 * Schema de entrada de `update-course-category` (módulo course-categories).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { UpdateCourseCategorySchema, zId } from "@repo/contracts";

export const updateCourseCategoryInputSchema = UpdateCourseCategorySchema.extend({ id: zId("Informe o id da categoria") });

export type UpdateCourseCategoryInput = z.infer<
  typeof updateCourseCategoryInputSchema
>;
