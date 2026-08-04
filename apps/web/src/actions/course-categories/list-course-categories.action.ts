"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseCategoryDto } from "@/lib/api/dto";
import { listCourseCategoriesInputSchema } from "@/schemas/course-categories/list-course-categories.schema";

/**
 * `GET /v1/course-categories` — Lista as categorias de curso.
 */
export async function listCourseCategories(): Promise<
  ActionResult<CourseCategoryDto[]>
> {
  return executeAction({
    input: {},
    schema: listCourseCategoriesInputSchema,
    auth: "none",
    run: (_input) =>
      apiRequest<{ ok: boolean; courseCategories: CourseCategoryDto[] }>(
        "/course-categories",
        {},
      ).then((response) => response.courseCategories)
  });
}
