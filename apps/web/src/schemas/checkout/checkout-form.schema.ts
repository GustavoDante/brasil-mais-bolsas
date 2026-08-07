/**
 * Modelo do formulário de assinatura e o schema de **cada passo**.
 *
 * Por que o `checkoutInputSchema` não serve de resolver do react-hook-form: na tela os
 * campos do cartão continuam no estado mesmo quando o aluno escolhe PIX (o input só some do
 * DOM), e um `""` ali reprovaria o envio de um pagamento que nem usa cartão. O modelo do
 * formulário trata só isso — campo em branco é campo não preenchido, a mesma adaptação de
 * meio de entrada que o cadastro público já faz.
 *
 * A regra continua vindo do contrato: cada passo valida com um recorte de `CheckoutSchema`,
 * e o envio final passa pelo `checkoutInputSchema` dentro da action.
 */
import { z } from "zod";
import { CheckoutSchema, CreditCardHolderInfoSchema, CreditCardSchema, zOptionalText } from "@repo/contracts";

/**
 * Espelha um objeto do contrato como campos de texto opcionais, preservando os nomes.
 * Derivado (e não redigitado) para que um campo novo no contrato apareça aqui sozinho.
 */
function asOptionalText<Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) {
  const shape = Object.fromEntries(
    Object.keys(schema.shape).map((key) => [key, zOptionalText()]),
  ) as { [Key in keyof Shape]: ReturnType<typeof zOptionalText> };

  return z.object(shape);
}

const customerSchema = CheckoutSchema.shape.customer.unwrap();

/** Passo 1 — dados do aluno. `complement` em branco vira ausente. */
export const checkoutCustomerStepSchema = customerSchema.extend({
  address: customerSchema.shape.address.extend({ complement: zOptionalText() }),
});

/** Passo 2 — forma de pagamento, com as condicionais do contrato (cartão x à vista). */
export const checkoutPaymentStepSchema = CheckoutSchema.shape.payment;

/** Passo 3 — aceite dos termos. */
export const checkoutTermsStepSchema = z.object({
  accepted_terms: CheckoutSchema.shape.accepted_terms,
});

export const checkoutFormSchema = z.object({
  customer: checkoutCustomerStepSchema,
  payment: z.object({
    method: checkoutPaymentStepSchema.shape.method,
    /**
     * Mesmo campo do contrato **sem** o `.optional().default(1)`: no formulário o valor
     * existe sempre (o select nasce em 1), e um schema cujo tipo de entrada difere do de
     * saída obrigaria o `useForm` a carregar os dois — sem ganho nenhum aqui. Os limites
     * de 1 a 21 continuam vindo do contrato.
     */
    installment_count: checkoutPaymentStepSchema.shape.installment_count.unwrap().unwrap(),
    creditCard: asOptionalText(CreditCardSchema),
    creditCardHolderInfo: asOptionalText(CreditCardHolderInfoSchema),
  }),
  accepted_terms: z.boolean(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
