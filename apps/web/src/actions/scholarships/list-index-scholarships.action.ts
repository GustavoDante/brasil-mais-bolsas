"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { HomeShowcaseItemDto } from "@/lib/api/dto";
import { listIndexScholarshipsInputSchema } from "@/schemas/scholarships/list-index-scholarships.schema";

/**
 * `GET /v1/scholarships/list/index` — Vitrine da home: por instituição, menor mensalidade e maior desconto.
 */
export async function listIndexScholarships(): Promise<
  ActionResult<HomeShowcaseItemDto[]>
> {
  return executeAction({
    input: {},
    schema: listIndexScholarshipsInputSchema,
    auth: "none",
    run: (_input) =>
      apiRequest<{ ok: boolean; scholarships: HomeShowcaseItemDto[] }>(
        "/scholarships/list/index",
        {},
      ).then((response) => response.scholarships)
  });
}
