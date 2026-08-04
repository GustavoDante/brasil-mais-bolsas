/**
 * Schema de entrada de `create-signed-contract` (módulo signed-contracts).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateSignedContractSchema } from "@repo/contracts";

export const createSignedContractInputSchema = CreateSignedContractSchema;

export type CreateSignedContractInput = z.infer<
  typeof createSignedContractInputSchema
>;
