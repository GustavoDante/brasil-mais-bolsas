/**
 * Schema de entrada de `list-partners` (módulo partners).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import { zOptionalDateString } from "@repo/contracts";

export const listPartnersInputSchema = z.object({
  startDate: zOptionalDateString(),
  endDate: zOptionalDateString(),
});

export type ListPartnersInput = z.infer<typeof listPartnersInputSchema>;
