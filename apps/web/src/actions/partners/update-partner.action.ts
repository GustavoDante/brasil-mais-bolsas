"use server";

import { UpdatePartnerSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zId,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = UpdatePartnerSchema.extend({ id: zId("Informe o id do parceiro") });

export type UpdatePartnerInput = z.infer<typeof schema>;

/**
 * `PUT /v1/partners/:id` — Atualiza um parceiro (admin).
 *
 * Requer sessão autenticada.
 */
export async function updatePartner(
  input: UpdatePartnerInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Parceiro atualizado.",
    revalidateTags: ["partners"],
    run: ({ id, name, code, password }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/partners/${encodeURIComponent(id)}`,
        { method: "PUT", body: { name, code, password }, token },
      ).then(() => null),
  });
}
