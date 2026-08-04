"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";
import {
  createScholarshipInputSchema,
  type CreateScholarshipInput,
} from "@/schemas/scholarships/create-scholarship.schema";

/**
 * `POST /v1/scholarships` — Cria uma bolsa (admin).
 *
 * Requer sessão autenticada.
 */
export async function createScholarship(
  input: CreateScholarshipInput,
): Promise<ActionResult<ScholarshipFullDto>> {
  return executeAction({
    input,
    schema: createScholarshipInputSchema,
    auth: "required",
    successMessage: "Bolsa criada.",
    revalidateTags: ["scholarships"],
    run: (
      {
        shift,
        type,
        full_price,
        discount,
        quantity_offered,
        renovation_days,
        register_period_start,
        register_period_end,
        course_description,
        course_id,
        institution_id,
        course_period,
        old_id,
        active,
        expired,
        is_yearly,
        registration_fee,
        adhesion_fee,
        registration_fee_discount,
        installments,
      },
      { token },
    ) =>
      apiRequest<{
        ok: boolean;
        message?: string;
        scholarship: ScholarshipFullDto;
      }>("/scholarships", {
        method: "POST",
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
          course_id,
          institution_id,
          course_period,
          old_id,
          active,
          expired,
          is_yearly,
          registration_fee,
          adhesion_fee,
          registration_fee_discount,
          installments,
        },
        token,
      }).then((response) => response.scholarship),
  });
}
