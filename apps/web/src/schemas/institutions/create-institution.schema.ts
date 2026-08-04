/**
 * Schema de entrada de `create-institution` (módulo institutions).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { CreateInstitutionSchema } from "@repo/contracts";

export const createInstitutionInputSchema = CreateInstitutionSchema;

export type CreateInstitutionInput = z.infer<typeof createInstitutionInputSchema>;
