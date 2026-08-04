"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserIdentityDto } from "@/lib/api/dto";
import { listUserIdentitiesInputSchema } from "@/schemas/user-identities/list-user-identities.schema";

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
    schema: listUserIdentitiesInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; items: UserIdentityDto[] }>(
        "/user-identities",
        { token },
      ).then((response) => response.items)
  });
}
