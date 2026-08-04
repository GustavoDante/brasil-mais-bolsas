"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";
import {
  updateNotificationInputSchema,
  type UpdateNotificationInput,
} from "@/schemas/notifications/update-notification.schema";

/**
 * `PATCH /v1/notifications/:id` — Atualiza uma notificação.
 *
 * Requer sessão autenticada.
 */
export async function updateNotification(
  input: UpdateNotificationInput,
): Promise<ActionResult<NotificationDto>> {
  return executeAction({
    input,
    schema: updateNotificationInputSchema,
    auth: "required",
    successMessage: "Notificação atualizada.",
    revalidateTags: ["notifications"],
    run: ({ id, title, message, user_id, read }, { token }) =>
      apiRequest<{
        ok: boolean;
        message: string;
        notification: NotificationDto;
      }>(`/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: { title, message, user_id, read },
        token,
      }).then((response) => response.notification),
  });
}
