"use server";

import { CreateCourseCategorySchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";

const schema = CreateCourseCategorySchema;

export type CreateCourseCategoryInput = z.infer<typeof schema>;

/**
 * `POST /v1/course-categories` — Cria uma categoria de curso (admin).
 *
 * Requer sessão autenticada.
 */
export async function createCourseCategory(
  input: CreateCourseCategoryInput,
): Promise<ActionResult<null>> {
  return executeAction({
    input,
    schema,
    auth: "required",
    successMessage: "Categoria criada.",
    revalidateTags: ["course-categories"],
    run: ({ name, old_id, order }, { token }) =>
      apiRequest<{ ok: boolean; message?: string }>("/course-categories", {
        method: "POST",
        body: { name, old_id, order },
        token,
      }).then(() => null),
  });
}
