"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import {
  updateScholarshipInputSchema,
  type UpdateScholarshipInput,
} from "@/schemas/scholarships/update-scholarship.schema";

/**
 * `PUT /v1/scholarships/:id` — Atualiza uma bolsa (admin).
 *
 * Requer sessão autenticada.
 */
export async function updateScholarship(
  input: UpdateScholarshipInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema: updateScholarshipInputSchema,
    auth: "required",
    successMessage: "Bolsa atualizada.",
    revalidateTags: ["scholarships"],
    run: (
      {
        id,
        shift,
        type,
        full_price,
        discount,
        quantity_offered,
        renovation_days,
        register_period_start,
        register_period_end,
        course_description,
        course_period,
        is_yearly,
        active,
        registration_fee,
        adhesion_fee,
        registration_fee_discount,
        installments,
      },
      { token },
    ) =>
      apiRequest<{ ok: boolean; message?: string }>(
        `/scholarships/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: {
            shift,
            type,
            full_price,
            discount,
            quantity_offered,
            renovation_days,
            register_period_start,
            register_period_end,
            course_description,
            course_period,
            is_yearly,
            active,
            registration_fee,
            adhesion_fee,
            registration_fee_discount,
            installments,
          },
          token,
        },
      ).then(() => null),
  });
}
