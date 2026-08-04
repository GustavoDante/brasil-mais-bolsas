"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { CourseCategoryDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListCourseCategoriesInput = z.infer<typeof schema>;

/**
 * `GET /v1/course-categories` — Lista as categorias de curso.
 */
export async function listCourseCategories(): Promise<
  ActionResult<CourseCategoryDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "none",
    run: (_input) =>
      apiRequest<{ ok: boolean; courseCategories: CourseCategoryDto[] }>(
        "/course-categories",
        {},
      ).then((response) => response.courseCategories),
  });
}
