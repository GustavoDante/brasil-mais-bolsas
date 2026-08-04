"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListUsersInput = z.infer<typeof schema>;

/**
 * `GET /v1/users` — Lista os usuários (admin vê todos; manager vê os da instituição).
 *
 * Requer sessão autenticada.
 */
export async function listUsers(): Promise<ActionResult<UserDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ users: UserDto[] }>("/users", {
        token,
        revalidate: false,
      }).then((response) => response.users),
  });
}
