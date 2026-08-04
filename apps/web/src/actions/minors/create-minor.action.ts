"use server";

import { CreateMinorSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { MinorDto } from "@/lib/api/dto";

const schema = CreateMinorSchema;

export type CreateMinorInput = z.infer<typeof schema>;

/**
 * `POST /v1/minors` — Cadastra um dependente para um usuário.
 *
 * Requer sessão autenticada.
 */
export async function createMinor(
  input: CreateMinorInput,
): Promise<ActionResult<MinorDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Dependente cadastrado.",
    revalidateTags: ["minors"],
    run: ({ user_id, name, birthdate }, { token }) =>
      apiRequest<{ ok: boolean; minor: MinorDto }>("/minors", {
        method: "POST",
        body: { user_id, name, birthdate },
        token,
      }).then((response) => response.minor),
  });
}
