"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";
import { listNotificationsInputSchema } from "@/schemas/notifications/list-notifications.schema";

/**
 * `GET /v1/notifications` — Lista as notificações do usuário autenticado (admin vê todas).
 *
 * Requer sessão autenticada.
 */
export async function listNotifications(): Promise<
  ActionResult<NotificationDto[]>
> {
  return executeAction({
    input: {},
    schema: listNotificationsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; notifications: NotificationDto[] }>(
        "/notifications",
        { token, revalidate: false },
      ).then((response) => response.notifications)
  });
}
