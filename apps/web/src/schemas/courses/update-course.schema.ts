/**
 * Schema de entrada de `update-course` (módulo courses).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { UpdateCourseSchema, zId } from "@repo/contracts";

export const updateCourseInputSchema = UpdateCourseSchema.extend({ id: zId("Informe o id do curso") });

export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>;
