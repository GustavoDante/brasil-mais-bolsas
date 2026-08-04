"use server";

import { UpdateUserSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";

const schema = UpdateUserSchema;

export type UpdateMeInput = z.infer<typeof schema>;

/**
 * `PUT /v1/users/me` — Atualiza os dados do usuário autenticado.
 *
 * Requer sessão autenticada.
 */
export async function updateMe(
  input: UpdateMeInput,
): Promise<ActionResult<UserDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Dados atualizados.",
    revalidateTags: ["users"],
    run: (
      {
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
      },
      { token },
    ) =>
      apiRequest<UserDto>("/users/me", {
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
        },
        token,
      }),
  });
}
