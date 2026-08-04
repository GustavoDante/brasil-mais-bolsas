"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PossiblePartnerDto } from "@/lib/api/dto";
import {
  createPossiblePartnerInputSchema,
  type CreatePossiblePartnerInput,
} from "@/schemas/possible-partners/create-possible-partner.schema";

/**
 * `POST /v1/possible-partners` — Envia o formulário "quero ser parceiro".
 */
export async function createPossiblePartner(
  input: CreatePossiblePartnerInput,
): Promise<ActionResult<PossiblePartnerDto>> {
  return executeAction({
    input,
    schema: createPossiblePartnerInputSchema,
    auth: "none",
    successMessage: "Recebemos seu contato. Em breve falaremos com você.",
    revalidateTags: ["possible-partners"],
    run: ({
      name,
      email,
      cell,
      institutionName,
      cnpj,
      modality,
      city,
      numStudents,
      message,
    }) =>
      apiRequest<{
        ok: boolean;
        message: string;
        possiblePartner: PossiblePartnerDto;
      }>("/possible-partners", {
        method: "POST",
        body: {
          name,
          email,
          cell,
          institutionName,
          cnpj,
          modality,
          city,
          numStudents,
          message,
        },
      }).then((response) => response.possiblePartner),
  });
}
