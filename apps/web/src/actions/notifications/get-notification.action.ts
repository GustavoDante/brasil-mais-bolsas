"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da notificação"),
});

export type GetNotificationInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; notification: NotificationDto }>(
        `/notifications/${encodeURIComponent(id)}`,
        { token, revalidate: false },
      ).then((response) => response.notification),
  });
}
