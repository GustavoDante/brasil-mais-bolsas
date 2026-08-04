"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserIdentityDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListUserIdentitiesInput = z.infer<typeof schema>;

/**
 * `GET /v1/user-identities` — Lista as identidades externas cadastradas.
 *
 * Requer sessão autenticada.
 */
export async function listUserIdentities(): Promise<
  ActionResult<UserIdentityDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; items: UserIdentityDto[] }>(
        "/user-identities",
        { token },
      ).then((response) => response.items),
  });
}
