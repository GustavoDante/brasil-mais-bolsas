import { z } from 'zod';

import { apiEnvelope } from '../common';
import { PaymentSchema } from '../models';
import { zEmail, zId, zInt, zOptionalBoolean, zText } from '../primitives';

export const CreatePixPaymentSchema = z
  .object({
    scholarship_id: zId('Informe a bolsa'),
    renew: zOptionalBoolean(),
  })
  .strict()
  .meta({ id: 'CreatePixPayment' });

export const CreateInterestPaymentSchema = z
  .object({
    scholarship_id: zId('Informe a bolsa'),
  })
  .strict()
  .meta({ id: 'CreateInterestPayment' });

/**
 * Dados do cartão. **Trafegam, nunca são persistidos** — vão direto para o gateway.
 * Nada aqui pode ser adicionado a um schema de response.
 */
export const CreditCardSchema = z
  .object({
    holderName: zText('Nome impresso no cartão obrigatório'),
    number: zText('Número do cartão de crédito obrigatório'),
    expiryMonth: z
      .string()
      .length(2, { error: 'Validade do cartão de crédito (mês) obrigatória' }),
    expiryYear: z.string().length(4, { error: 'Validade do cartão de crédito (ano) obrigatória' }),
    ccv: zText('Código de segurança (CCV) obrigatório'),
  })
  .strict()
  .meta({ id: 'CreditCard' });

export const CreditCardHolderInfoSchema = z
  .object({
    name: zText('Nome do portador do cartão obrigatório'),
    email: zEmail(),
    cpfCnpj: zText('CPF/CNPJ do portador do cartão obrigatório'),
    postalCode: zText('CEP do portador do cartão obrigatório'),
    addressNumber: zText('Número do endereço do portador do cartão obrigatório'),
    addressComplement: z.string().optional(),
    phone: z.string().optional(),
    mobilePhone: zText('Celular do portador do cartão obrigatório'),
  })
  .strict()
  .meta({ id: 'CreditCardHolderInfo' });

export const CreateCreditCardPaymentSchema = z
  .object({
    scholarship_id: zId('Informe a bolsa'),
    installment_count: zInt('Número de parcelas inválido', { min: 1, max: 21 })
      .optional()
      .default(1),
    renew: zOptionalBoolean(),
    creditCard: CreditCardSchema,
    creditCardHolderInfo: CreditCardHolderInfoSchema,
    /** Exigido pelo antifraude do gateway. */
    remoteIp: z.union([z.ipv4(), z.ipv6()]),
  })
  .strict()
  .meta({ id: 'CreateCreditCardPayment' });

/**
 * Webhook do Asaas. **Sem `.strict()` de propósito**: o payload é de terceiro e ganha
 * campos novos sem aviso; rejeitar por campo desconhecido derrubaria a baixa de pagamento.
 */
export const AsaasWebhookSchema = z
  .object({
    event: zText('Evento obrigatório'),
    payment: z.object({
      id: zText('Id do pagamento obrigatório'),
      status: zText('Status obrigatório'),
      billingType: zText('Tipo de cobrança obrigatório'),
      value: z.number().optional(),
    }),
  })
  .meta({ id: 'AsaasWebhook' });

export const PaymentResponseSchema = PaymentSchema.meta({ id: 'PaymentResponse' });

export const PaymentEnvelopeSchema = apiEnvelope('payment', PaymentResponseSchema);
export const PaymentListEnvelopeSchema = apiEnvelope('payments', z.array(PaymentResponseSchema));

export type CreatePixPaymentInput = z.infer<typeof CreatePixPaymentSchema>;
export type CreateInterestPaymentInput = z.infer<typeof CreateInterestPaymentSchema>;
export type CreateCreditCardPaymentInput = z.infer<typeof CreateCreditCardPaymentSchema>;
export type AsaasWebhookInput = z.infer<typeof AsaasWebhookSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
