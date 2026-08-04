"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { MinorDto } from "@/lib/api/dto";
import {
  createMinorInputSchema,
  type CreateMinorInput,
} from "@/schemas/minors/create-minor.schema";

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
    schema: createMinorInputSchema,
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
