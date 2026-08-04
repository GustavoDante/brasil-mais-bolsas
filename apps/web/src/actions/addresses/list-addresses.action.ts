"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AddressDto } from "@/lib/api/dto";
import { listAddressesInputSchema } from "@/schemas/addresses/list-addresses.schema";

/**
 * `GET /v1/addresses` — Lista os endereços cadastrados.
 */
export async function listAddresses(): Promise<ActionResult<AddressDto[]>> {
  return executeAction({
    input: {},
    schema: listAddressesInputSchema,
    auth: "optional",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; addresses: AddressDto[] }>("/addresses", {
        token
      }).then((response) => response.addresses)
  });
}
