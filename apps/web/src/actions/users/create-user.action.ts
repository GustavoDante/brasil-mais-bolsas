"use server";

import { CreateUserSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { UserDto } from "@/lib/api/dto";

const schema = CreateUserSchema;

export type CreateUserInput = z.infer<typeof schema>;

/**
 * `POST /v1/users` — Cria um usuário com endereço (admin).
 *
 * Requer sessão autenticada.
 */
export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult<UserDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Usuário criado.",
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
        type,
        secondary_phone,
        whatsapp_phone,
        friend_phone,
        family_income,
        ccp,
        observations,
        partner_id,
        institution_id,
        address,
      },
      { token },
    ) =>
      apiRequest<UserDto>("/users", {
        method: "POST",
        body: {
          name,
          email,
          phone,
          birthdate,
          cpf,
          rg,
          rg_emissor,
          type,
          secondary_phone,
          whatsapp_phone,
          friend_phone,
          family_income,
          ccp,
          observations,
          partner_id,
          institution_id,
          address,
        },
        token,
      }),
  });
}
