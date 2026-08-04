"use server";

import { CreateNewScholarshipValueSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";

const schema = CreateNewScholarshipValueSchema;

export type CreateScholarshipValueInput = z.infer<typeof schema>;

/**
 * `POST /v1/scholarships/new_value` — Cria uma nova versão de valores para uma bolsa (admin).
 *
 * Requer sessão autenticada.
 */
export async function createScholarshipValue(
  input: CreateScholarshipValueInput,
): Promise<ActionResult<ScholarshipFullDto>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Novo valor cadastrado.",
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
        scholarship_id,
      },
      { token },
    ) =>
      apiRequest<{
        ok: boolean;
        message?: string;
        scholarship: ScholarshipFullDto;
      }>("/scholarships/new_value", {
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
          scholarship_id,
        },
        token,
      }).then((response) => response.scholarship),
  });
}
