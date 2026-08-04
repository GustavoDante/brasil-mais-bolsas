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

export type ListRandomScholarshipsInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/list/random` — Bolsas aleatórias para os destaques do site.
 */
export async function listRandomScholarships(
  input: ListRandomScholarshipsInput,
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
        "/scholarships/list/random",
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
