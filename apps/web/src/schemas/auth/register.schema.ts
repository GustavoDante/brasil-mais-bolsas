/**
 * Schema de entrada de `register` (módulo auth).
 *
 * Vive fora da action para que o formulário possa usar o mesmo objeto no
 * `zodResolver` do react-hook-form: a tela valida exatamente o que a action
 * valida, e a action valida exatamente o que a API valida.
 */
import { z } from "zod";
import {
  CreateAddressSchema,
  RegisterSchema,
  zNumericString,
  zOptionalText,
} from "@repo/contracts";

/**
 * Campo de texto vazio é campo não preenchido.
 *
 * Um `<input>` em branco entrega `""`, nunca `undefined`. No contrato os opcionais são
 * `z.string().optional()`, que aceita `""` e gravaria string vazia no lugar de nulo — e
 * `family_income` é pior: a regex numérica **rejeita** `""`, então deixar a renda em
 * branco reprovaria o formulário inteiro. Isto não redeclara regra de negócio, só trata o
 * meio de entrada (mesma razão de existirem os blocos `zQuery*` no contrato).
 */
export const registerInputSchema = RegisterSchema.extend({
  secondary_phone: zOptionalText(),
  whatsapp_phone: zOptionalText(),
  friend_phone: zOptionalText(),
  ccp: zOptionalText(),
  register_scholarship: zOptionalText(),
  partner_code: zOptionalText(),
  family_income: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .pipe(zNumericString().optional())
    .optional(),
  address: CreateAddressSchema.extend({ complement: zOptionalText() }),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
