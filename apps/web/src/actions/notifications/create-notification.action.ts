"use server";

import { CreateNotificationSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NotificationDto } from "@/lib/api/dto";

const schema = CreateNotificationSchema;

export type CreateNotificationInput = z.infer<typeof schema>;

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
    schema,
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
