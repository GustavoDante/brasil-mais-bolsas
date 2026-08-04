"use server";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
  zOptionalText,
  zStringArray,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScholarshipFullDto } from "@/lib/api/dto";

const schema = z.object({
  alreadyListed: zStringArray(),
  type: zOptionalText(),
  institution: zOptionalText(),
  city: zOptionalText(),
  category: zOptionalText(),
  course: zOptionalText(),
  showExpired: zOptionalText(),
  showInativas: zOptionalText(),
});

export type ListOrderedScholarshipsInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/list/order` — Bolsas ordenadas por categoria, com filtros do site.
 */
export async function listOrderedScholarships(
  input: ListOrderedScholarshipsInput,
): Promise<ActionResult<ScholarshipFullDto[]>> {
  return executeAction({
    input,
    schema,
    auth: "none",
    run: ({
      alreadyListed,
      type,
      institution,
      city,
      category,
      course,
      showExpired,
      showInativas,
    }) =>
      apiRequest<{ ok: boolean; scholarships: ScholarshipFullDto[] }>(
        "/scholarships/list/order",
        {
          query: {
            alreadyListed,
            type,
            institution,
            city,
            category,
            course,
            showExpired,
            showInativas,
          },
        },
      ).then((response) => response.scholarships),
  });
}
