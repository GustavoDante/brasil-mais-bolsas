"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AddressDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListAddressesInput = z.infer<typeof schema>;

/**
 * `GET /v1/addresses` — Lista os endereços cadastrados.
 */
export async function listAddresses(): Promise<ActionResult<AddressDto[]>> {
  return executeAction({
    input: {},
    schema,
    auth: "optional",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; addresses: AddressDto[] }>("/addresses", {
        token,
      }).then((response) => response.addresses),
  });
}
