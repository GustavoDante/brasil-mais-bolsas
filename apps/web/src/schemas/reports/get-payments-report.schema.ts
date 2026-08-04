/**
 * Schema de entrada de `get-payments-report` (módulo reports).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { PaymentsReportQuerySchema } from "@repo/contracts";

export const getPaymentsReportInputSchema = PaymentsReportQuerySchema;

export type GetPaymentsReportInput = z.infer<typeof getPaymentsReportInputSchema>;
