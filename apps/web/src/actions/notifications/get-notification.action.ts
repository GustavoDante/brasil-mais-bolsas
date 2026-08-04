"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";
import {
  getNotificationInputSchema,
  type GetNotificationInput,
} from "@/schemas/notifications/get-notification.schema";

/**
 * `GET /v1/notifications/:id` — Busca uma notificação pelo id.
 *
 * Requer sessão autenticada.
 */
export async function getNotification(
  input: GetNotificationInput,
): Promise<ActionResult<NotificationDto>> {
  return executeAction({
    input,
    schema: getNotificationInputSchema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; notification: NotificationDto }>(
        `/notifications/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ).then((response) => response.notification),
  });
}
