"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListNotificationsInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; notifications: NotificationDto[] }>(
        "/notifications",
        { token, revalidate: false },
      ).then((response) => response.notifications),
  });
}
