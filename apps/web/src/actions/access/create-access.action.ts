"use server";

import { CreateAccessSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AccessDto } from "@/lib/api/dto";

const schema = CreateAccessSchema;

export type CreateAccessInput = z.infer<typeof schema>;

/**
 * `POST /v1/access` — Registra um acesso para um parceiro.
 *
 * Requer sessão autenticada.
 */
export async function createAccess(
  input: CreateAccessInput,
): Promise<ActionResult<AccessDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Acesso registrado.",
    revalidateTags: ["accesses"],
    run: ({ partner_id }, { token }) =>
      apiRequest<{ ok: boolean; access: AccessDto }>("/access", {
        method: "POST",
        body: { partner_id },
        token,
      }).then((response) => response.access),
  });
}
