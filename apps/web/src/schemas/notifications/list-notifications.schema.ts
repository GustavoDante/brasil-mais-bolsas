/**
 * Schema de entrada de `list-notifications` (módulo notifications).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";

export const listNotificationsInputSchema = z.object({});

export type ListNotificationsInput = z.infer<typeof listNotificationsInputSchema>;
