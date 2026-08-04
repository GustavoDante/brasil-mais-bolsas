"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AuthProfileDto } from "@/lib/api/dto";

const schema = z.object({});

export type GetProfileInput = z.infer<typeof schema>;

/**
 * `GET /v1/auth/me` — Perfil mínimo do token (id, e-mail e tipo).
 *
 * Requer sessão autenticada.
 */
export async function getProfile(): Promise<ActionResult<AuthProfileDto>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<AuthProfileDto>("/auth/me", { token, revalidate: false }),
  });
}
