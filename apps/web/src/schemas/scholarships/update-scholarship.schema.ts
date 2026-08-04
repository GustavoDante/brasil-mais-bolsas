/**
 * Schema de entrada de `update-scholarship` (módulo scholarships).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { UpdateScholarshipSchema, zId } from "@repo/contracts";

export const updateScholarshipInputSchema = UpdateScholarshipSchema.extend({ id: zId("Informe o id da bolsa") });

export type UpdateScholarshipInput = z.infer<typeof updateScholarshipInputSchema>;
