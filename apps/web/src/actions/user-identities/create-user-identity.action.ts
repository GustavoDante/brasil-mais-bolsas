"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserIdentityDto } from "@/lib/api/dto";
import {
  createUserIdentityInputSchema,
  type CreateUserIdentityInput,
} from "@/schemas/user-identities/create-user-identity.schema";

/**
 * `POST /v1/user-identities` — Vincula uma identidade externa (login social) a um usuário.
 *
 * Requer sessão autenticada.
 */
export async function createUserIdentity(
  input: CreateUserIdentityInput,
): Promise<ActionResult<UserIdentityDto>> {
  return executeAction({
    input,
    schema: createUserIdentityInputSchema,
    auth: "required",
    successMessage: "Identidade vinculada.",
    revalidateTags: ["user-identities"],
    run: ({ provider, provider_account_id, user_id }, { token }) =>
      apiRequest<{ ok: boolean; rec: UserIdentityDto }>("/user-identities", {
        method: "POST",
        body: { provider, provider_account_id, user_id },
        token,
      }).then((response) => response.rec),
  });
}
