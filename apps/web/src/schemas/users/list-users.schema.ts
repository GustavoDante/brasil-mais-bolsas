/**
 * Schema de entrada de `list-users` (módulo users).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";

export const listUsersInputSchema = z.object({});

export type ListUsersInput = z.infer<typeof listUsersInputSchema>;
