"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  updateInstitutionInputSchema,
  type UpdateInstitutionInput,
} from "@/schemas/institutions/update-institution.schema";

/**
 * `PUT /v1/institutions/:id` — Atualiza uma instituição (admin ou manager da instituição).
 *
 * Requer sessão autenticada.
 */
export async function updateInstitution(
  input: UpdateInstitutionInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: updateInstitutionInputSchema,
    auth: "required",
    successMessage: "Instituição atualizada.",
    revalidateTags: ["institutions"],
    run: (
      {
        id,
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
      apiRequest<{ ok: boolean; message?: string }>(
        `/institutions/${encodeURIComponent(id)}`,
        {
          method: "PUT",
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
        },
      ).then(() => null),
  });
}
