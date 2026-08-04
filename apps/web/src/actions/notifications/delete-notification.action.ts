"use server";

import { z } from "zod";
import { executeAction, type ActionResult, zId } from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = z.object({
  id: zId("Informe o id da notificação"),
});

export type DeleteNotificationInput = z.infer<typeof schema>;

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
    schema,
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
