/**
 * Schema de entrada de `create-notification` (módulo notifications).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateNotificationSchema } from "@repo/contracts";

export const createNotificationInputSchema = CreateNotificationSchema;

export type CreateNotificationInput = z.infer<
  typeof createNotificationInputSchema
>;
