"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";
import {
  updateUserInputSchema,
  type UpdateUserInput,
} from "@/schemas/users/update-user.schema";

/**
 * `PUT /v1/users/:id` — Atualiza um usuário (admin), incluindo tipo e situação.
 *
 * Requer sessão autenticada.
 */
export async function updateUser(
  input: UpdateUserInput,
): Promise<ActionResult<UserDto>> {
  return executeAction({
    input,
    schema: updateUserInputSchema,
    auth: "required",
    successMessage: "Usuário atualizado.",
    revalidateTags: ["users"],
    run: (
      {
        id,
        name,
        email,
        phone,
        birthdate,
        cpf,
        rg,
        rg_emissor,
        secondary_phone,
        whatsapp_phone,
        friend_phone,
        family_income,
        ccp,
        observations,
        password,
        address,
        type,
        active,
      },
      { token },
    ) =>
      apiRequest<UserDto>(`/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: {
          name,
          email,
          phone,
          birthdate,
          cpf,
          rg,
          rg_emissor,
          secondary_phone,
          whatsapp_phone,
          friend_phone,
          family_income,
          ccp,
          observations,
          password,
          address,
          type,
          active,
        },
        token,
      }),
  });
}
