/**
 * Schema de entrada de `create-external-client` (módulo external-clients).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateExternalClientSchema } from "@repo/contracts";

export const createExternalClientInputSchema = CreateExternalClientSchema;

export type CreateExternalClientInput = z.infer<
  typeof createExternalClientInputSchema
>;
