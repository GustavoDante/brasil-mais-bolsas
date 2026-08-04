/**
 * Schema de entrada de `create-user-identity` (módulo user-identities).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateUserIdentitySchema } from "@repo/contracts";

export const createUserIdentityInputSchema = CreateUserIdentitySchema;

export type CreateUserIdentityInput = z.infer<
  typeof createUserIdentityInputSchema
>;
