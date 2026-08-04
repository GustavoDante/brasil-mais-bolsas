"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";

const schema = z.object({
  id: zId("Informe o id da notificação"),
});

export type MarkNotificationAsReadInput = z.infer<typeof schema>;

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
    schema,
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
