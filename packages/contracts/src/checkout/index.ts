import { z } from 'zod';

import { apiEnvelope } from '../common';
import { PaymentResponseSchema, CreditCardHolderInfoSchema, CreditCardSchema } from '../payments';
import { zEnumValue, zId, zInt } from '../primitives';
import { RegisterSchema } from '../users/requests';

/**
 * Checkout de bolsa (`POST /v1/checkout`) — cadastro + cobrança numa requisição só.
 *
 * Por que uma rota própria em vez de o frontend chamar `auth/register` e depois
 * `payment/*`: entre as duas chamadas existe um estado que ninguém quer ver em produção —
 * usuário criado e cobrança recusada, com o aluno sem saber que já tem conta. Aqui as duas
 * etapas ficam sob o mesmo pedido e a compensação do pagamento já existente vale para o
 * fluxo inteiro.
 */

export const CHECKOUT_PAYMENT_METHODS = ['PIX', 'CREDIT_CARD', 'BOLETO'] as const;

export const CheckoutPaymentMethodSchema = zEnumValue(
  CHECKOUT_PAYMENT_METHODS,
  'Forma de pagamento inválida',
);

/**
 * O que a API exige para criar o aluno — o `RegisterSchema` sem nenhum campo opcional.
 *
 * Derivar por `.omit()` em vez de redeclarar é o que garante que um campo novo obrigatório
 * no cadastro apareça também aqui: quem esquecer de tratá-lo quebra o build, não a rota.
 * `register_scholarship` sai porque o servidor o preenche com a bolsa do checkout, e
 * `partner_code` porque não há onde informá-lo neste fluxo.
 */
export const CheckoutCustomerSchema = RegisterSchema.omit({
  secondary_phone: true,
  whatsapp_phone: true,
  friend_phone: true,
  family_income: true,
  ccp: true,
  register_scholarship: true,
  partner_code: true,
})
  .strict()
  .meta({ id: 'CheckoutCustomer', description: 'Dados mínimos para criar o aluno' });

/**
 * Forma de pagamento escolhida, com as regras que dependem dela.
 *
 * As condicionais moram **neste** objeto (e não na raiz do checkout) porque só olham campos
 * daqui: assim o passo de pagamento do formulário multi-step valida com exatamente este
 * schema, sem a regra precisar ser reescrita no frontend.
 *
 * Não é `z.discriminatedUnion` de propósito: a união troca a forma do objeto conforme o
 * método, e o react-hook-form precisa de caminhos estáveis (`payment.creditCard.number`)
 * para registrar campo e devolver erro. Com `superRefine` o caminho do problema continua
 * sendo o do campo, e vira `fieldErrors` no lugar certo do formulário.
 */
export const CheckoutPaymentSchema = z
  .object({
    method: CheckoutPaymentMethodSchema,
    installment_count: zInt('Número de parcelas inválido', { min: 1, max: 21 })
      .optional()
      .default(1),
    creditCard: CreditCardSchema.optional(),
    creditCardHolderInfo: CreditCardHolderInfoSchema.optional(),
    /**
     * Origem da requisição, exigida pelo antifraude do gateway. **A API preenche com o IP
     * de quem chamou** quando o campo não vem — é o único valor confiável: um IP escolhido
     * pelo cliente não diz nada sobre a origem real da compra.
     */
    remoteIp: z.union([z.ipv4(), z.ipv6()]).optional(),
  })
  .strict()
  .superRefine((payment, ctx) => {
    if (payment.method === 'CREDIT_CARD') {
      if (!payment.creditCard) {
        ctx.addIssue({
          code: 'custom',
          path: ['creditCard'],
          message: 'Informe os dados do cartão',
        });
      }

      if (!payment.creditCardHolderInfo) {
        ctx.addIssue({
          code: 'custom',
          path: ['creditCardHolderInfo'],
          message: 'Informe os dados do titular do cartão',
        });
      }

      return;
    }

    // PIX e boleto são cobrança à vista: aceitar dados de cartão aqui faria o payload
    // sugerir um parcelamento que o gateway não vai executar.
    if (payment.creditCard || payment.creditCardHolderInfo) {
      ctx.addIssue({
        code: 'custom',
        path: ['creditCard'],
        message: 'Dados de cartão só se aplicam ao pagamento com cartão de crédito',
      });
    }

    if (payment.installment_count > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['installment_count'],
        message: 'Parcelamento disponível apenas no cartão de crédito',
      });
    }
  })
  .meta({ id: 'CheckoutPayment' });

export const CheckoutSchema = z
  .object({
    scholarship_id: zId('Informe a bolsa'),
    /**
     * Ausente quando a requisição vem autenticada — nesse caso o usuário é o do token e
     * este campo é ignorado.
     */
    customer: CheckoutCustomerSchema.optional(),
    payment: CheckoutPaymentSchema,
    accepted_terms: z.literal(true, { error: 'É necessário aceitar os termos de uso' }),
  })
  .strict()
  .meta({ id: 'Checkout', description: 'Cadastro (quando necessário) + cobrança da bolsa' });

/** QR Code do PIX, como o Asaas o devolve. */
export const CheckoutPixQrCodeSchema = z
  .object({
    /** Imagem do QR Code em base64, sem o prefixo `data:`. */
    encodedImage: z.string(),
    /** Copia e cola. */
    payload: z.string(),
    expirationDate: z.string(),
  })
  .meta({ id: 'CheckoutPixQrCode' });

/**
 * O que a tela precisa para conduzir o pagamento, já normalizado entre as três formas —
 * a resposta crua do gateway muda de campo conforme o método.
 */
export const CheckoutChargeSchema = z
  .object({
    method: CheckoutPaymentMethodSchema,
    /** Status do gateway (`PENDING`, `CONFIRMED`, `RECEIVED`, ...). */
    status: z.string(),
    invoiceUrl: z.string().nullish(),
    pixQrCode: CheckoutPixQrCodeSchema.nullish(),
    bankSlipUrl: z.string().nullish(),
    /** Linha digitável do boleto. */
    barCode: z.string().nullish(),
  })
  .meta({ id: 'CheckoutCharge' });

export const CheckoutResultSchema = z
  .object({
    payment: PaymentResponseSchema,
    charge: CheckoutChargeSchema,
    /**
     * Só vem quando o checkout criou a conta: o aluno segue para o acompanhamento do
     * pagamento já autenticado, sem passar pelo login com a senha provisória.
     */
    accessToken: z.string().optional(),
  })
  .meta({ id: 'CheckoutResult' });

export const CheckoutEnvelopeSchema = apiEnvelope('checkout', CheckoutResultSchema);

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];
export type CheckoutCustomerInput = z.infer<typeof CheckoutCustomerSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type CheckoutPixQrCode = z.infer<typeof CheckoutPixQrCodeSchema>;
export type CheckoutCharge = z.infer<typeof CheckoutChargeSchema>;
export type CheckoutResult = z.infer<typeof CheckoutResultSchema>;
