/**
 * Schema de entrada de `update-notification` (módulo notifications).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { UpdateNotificationSchema, zId } from "@repo/contracts";

export const updateNotificationInputSchema = UpdateNotificationSchema.extend({ id: zId("Informe o id da notificação") });

export type UpdateNotificationInput = z.infer<
  typeof updateNotificationInputSchema
>;
