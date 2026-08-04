"use server";

import { CreateInstitutionSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = CreateInstitutionSchema;

export type CreateInstitutionInput = z.infer<typeof schema>;

/**
 * `POST /v1/institutions` — Cria uma instituição (admin).
 *
 * Requer sessão autenticada.
 */
export async function createInstitution(
  input: CreateInstitutionInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Instituição criada.",
    revalidateTags: ["institutions"],
    run: (
      {
        name,
        description,
        image,
        cnpj,
        email,
        email_2,
        phone,
        phone_2,
        phone_3,
        owner_name,
        owner_phone,
        owner_secondary_phone,
        owner_birthdate,
        operator_name,
        operator_phone,
        operator_birthdate,
        operator_2_name,
        operator_2_phone,
        operator_2_birthdate,
        street,
        number,
        district,
        city,
        state,
        postal_code,
        students_count,
        observations,
        old_id,
        fake,
        seller_id,
      },
      { token },
    ) =>
      apiRequest<{ ok: boolean; message?: string }>("/institutions", {
        method: "POST",
        body: {
          name,
          description,
          image,
          cnpj,
          email,
          email_2,
          phone,
          phone_2,
          phone_3,
          owner_name,
          owner_phone,
          owner_secondary_phone,
          owner_birthdate,
          operator_name,
          operator_phone,
          operator_birthdate,
          operator_2_name,
          operator_2_phone,
          operator_2_birthdate,
          street,
          number,
          district,
          city,
          state,
          postal_code,
          students_count,
          observations,
          old_id,
          fake,
          seller_id,
        },
        token,
      }).then(() => null),
  });
}
