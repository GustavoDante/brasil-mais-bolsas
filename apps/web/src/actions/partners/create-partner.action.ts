"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  createPartnerInputSchema,
  type CreatePartnerInput,
} from "@/schemas/partners/create-partner.schema";

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
    schema: createPartnerInputSchema,
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
