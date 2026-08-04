"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  deleteNotificationInputSchema,
  type DeleteNotificationInput,
} from "@/schemas/notifications/delete-notification.schema";

/**
 * `DELETE /v1/notifications/:id` — Remove uma notificação.
 *
 * Requer sessão autenticada.
 */
export async function deleteNotification(
  input: DeleteNotificationInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: deleteNotificationInputSchema,
    auth: "required",
    successMessage: "Notificação removida.",
    revalidateTags: ["notifications"],
    run: ({ id }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/notifications/${encodeURIComponent(id)}`,
        { method: "DELETE", token },
      ).then(() => null),
  });
}
