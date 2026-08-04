"use server";

import { CreatePartnerSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = CreatePartnerSchema;

export type CreatePartnerInput = z.infer<typeof schema>;

/**
 * `POST /v1/partners` — Cria um parceiro (admin).
 *
 * Requer sessão autenticada.
 */
export async function createPartner(
  input: CreatePartnerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Parceiro criado.",
    revalidateTags: ["partners"],
    run: ({ name, code, password }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>("/partners", {
        method: "POST",
        body: { name, code, password },
        token,
      }).then(() => null),
  });
}
