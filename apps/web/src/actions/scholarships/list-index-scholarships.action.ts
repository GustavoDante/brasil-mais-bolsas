"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { HomeShowcaseItemDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListIndexScholarshipsInput = z.infer<typeof schema>;

/**
 * `GET /v1/scholarships/list/index` — Vitrine da home: por instituição, menor mensalidade e maior desconto.
 */
export async function listIndexScholarships(): Promise<
  ActionResult<HomeShowcaseItemDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "none",
    run: (_input) =>
      apiRequest<{ ok: boolean; scholarships: HomeShowcaseItemDto[] }>(
        "/scholarships/list/index",
        {},
      ).then((response) => response.scholarships),
  });
}
