"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalText,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { NamedEntityDto } from "@/lib/api/dto";

const schema = z.object({
  city: zOptionalText(),
  category: zOptionalText(),
});

export type ListScholarshipCoursesByCityInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/list/course/bycity` — Lista cursos com bolsas em uma cidade e categoria.
 */
export async function listScholarshipCoursesByCity(
  input: ListScholarshipCoursesByCityInput,
): Promise<ActionResult<NamedEntityDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({ city, category }) =>
      apiRequest<{ ok: boolean; courses: NamedEntityDto[] }>(
        "/scholarships/list/course/bycity",
        { query: { city, category } },
      ).then((response) => response.courses),
  });
}
