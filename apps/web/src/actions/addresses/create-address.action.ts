"use server";

import { CreateAddressStandaloneSchema } from "@repo/contracts";

import { z } from "zod";
import {
  executeAction,
  type ActionResult,
} from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { AddressDto } from "@/lib/api/dto";

const schema = CreateAddressStandaloneSchema;

export type CreateAddressInput = z.infer<typeof schema>;

/**
 * `POST /v1/addresses` — Cria um endereço avulso vinculado a um usuário.
 */
export async function createAddress(
  input: CreateAddressInput,
): Promise<ActionResult<AddressDto>> {
  return executeAction({
    input,
    schema,
    auth: "optional",
    successMessage: "Endereço cadastrado.",
    revalidateTags: ["addresses"],
    run: (
      { user_id, street, city, state, number, district, postal_code },
      { token },
    ) =>
      apiRequest<{ ok: boolean; address: AddressDto }>("/addresses", {
        method: "POST",
        body: { user_id, street, city, state, number, district, postal_code },
        token,
      }).then((response) => response.address),
  });
}
