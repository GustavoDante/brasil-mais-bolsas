/**
 * Schema de entrada de `get-course-by-old-id` (módulo courses).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zId } from "@repo/contracts";

export const getCourseByOldIdInputSchema = z.object({
  id: zId("Informe o id do curso no sistema antigo"),
});

export type GetCourseByOldIdInput = z.infer<typeof getCourseByOldIdInputSchema>;
