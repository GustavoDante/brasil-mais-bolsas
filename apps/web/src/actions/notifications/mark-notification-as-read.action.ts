"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";
import {
  markNotificationAsReadInputSchema,
  type MarkNotificationAsReadInput,
} from "@/schemas/notifications/mark-notification-as-read.schema";

/**
 * `PATCH /v1/notifications/:id/read` — Marca uma notificação como lida.
 *
 * Requer sessão autenticada.
 */
export async function markNotificationAsRead(
  input: MarkNotificationAsReadInput,
): Promise<ActionResult<NotificationDto>> {
  return executeAction({
    input,
    schema: markNotificationAsReadInputSchema,
    auth: "required",
    revalidateTags: ["notifications"],
    run: ({ id }, { token }) =>
      apiRequest<{
        ok: boolean;
        message: string;
        notification: NotificationDto;
      }>(`/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        token,
      }).then((response) => response.notification),
  });
}
