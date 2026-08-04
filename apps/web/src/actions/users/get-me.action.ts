"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";

const schema = z.object({});

export type GetMeInput = z.infer<typeof schema>;

/**
 * `GET /v1/users/me` — Dados completos do usuário autenticado.
 *
 * Requer sessão autenticada.
 */
export async function getMe(): Promise<ActionResult<UserDto>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<UserDto>("/users/me", { token, revalidate: false }),
  });
}
