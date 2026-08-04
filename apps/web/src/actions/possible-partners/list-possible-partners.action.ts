"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { PossiblePartnerDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListPossiblePartnersInput = z.infer<typeof schema>;

/**
 * `GET /v1/possible-partners` — Lista os possíveis parceiros (admin).
 *
 * Requer sessão autenticada.
 */
export async function listPossiblePartners(): Promise<
  ActionResult<PossiblePartnerDto[]>
> {
  return executeAction({
    input: {},
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; possiblePartners: PossiblePartnerDto[] }>(
        "/possible-partners",
        { token },
      ).then((response) => response.possiblePartners),
  });
}
