/**
 * Schema de entrada de `list-renewals-report` (módulo reports).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { RenewalsReportQuerySchema } from "@repo/contracts";

export const listRenewalsReportInputSchema = RenewalsReportQuerySchema;

export type ListRenewalsReportInput = z.infer<
  typeof listRenewalsReportInputSchema
>;
