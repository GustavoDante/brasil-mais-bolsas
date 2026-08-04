/**
 * Schema de entrada de `list-accesses` (módulo access).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";

export const listAccessesInputSchema = z.object({});

export type ListAccessesInput = z.infer<typeof listAccessesInputSchema>;
