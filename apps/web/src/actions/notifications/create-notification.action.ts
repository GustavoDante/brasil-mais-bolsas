"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";
import {
  createNotificationInputSchema,
  type CreateNotificationInput,
} from "@/schemas/notifications/create-notification.schema";

/**
 * `POST /v1/notifications` — Cria uma notificação para um usuário (admin).
 *
 * Requer sessão autenticada.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<ActionResult<NotificationDto>> {
  return executeAction({
    input,
    schema: createNotificationInputSchema,
    auth: "required",
    successMessage: "Notificação criada.",
    revalidateTags: ["notifications"],
    run: ({ title, message, user_id, read }, { token }) =>
      apiRequest<{
        ok: boolean;
        message: string;
        notification: NotificationDto;
      }>("/notifications", {
        method: "POST",
        body: { title, message, user_id, read },
        token,
      }).then((response) => response.notification),
  });
}
