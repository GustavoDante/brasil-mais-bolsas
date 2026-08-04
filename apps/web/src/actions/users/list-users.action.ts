"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";
import { listUsersInputSchema } from "@/schemas/users/list-users.schema";

/**
 * `GET /v1/users` — Lista os usuários (admin vê todos; manager vê os da instituição).
 *
 * Requer sessão autenticada.
 */
export async function listUsers(): Promise<ActionResult<UserDto[]>> {
  return executeAction({
    input: {},
    schema: listUsersInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ users: UserDto[] }>("/users", {
        token,
        revalidate: false
      }).then((response) => response.users)
  });
}
