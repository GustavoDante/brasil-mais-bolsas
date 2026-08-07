/**
 * Modelos de domínio do fluxo de assinatura, consumidos pela UI.
 *
 * Como o resto de `src/types`: camelCase, nada de `Decimal` como string na tela.
 */
import type { CheckoutPaymentMethodDto } from "@/lib/api/dto";

export type CheckoutPaymentMethod = CheckoutPaymentMethodDto;

/** Dados do aluno já cadastrado, usados para preencher (e travar) o primeiro passo. */
export interface CheckoutCustomerPrefill {
  name: string;
  email: string;
  phone: string;
  /** `yyyy-MM-dd`, formato que o `<input type="date">` exige. */
  birthdate: string;
  cpf: string;
  rg: string;
  rgEmissor: string;
  address: {
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

/** O que a tela precisa para conduzir o pagamento depois da cobrança criada. */
export interface CheckoutCharge {
  paymentId: string;
  method: CheckoutPaymentMethod;
  status: string;
  /** `true` quando o gateway já confirmou (cartão aprovado na hora). */
  paid: boolean;
  invoiceUrl: string | null;
  pixQrCodeImage: string | null;
  pixCopyPaste: string | null;
  bankSlipUrl: string | null;
  barCode: string | null;
}

/** Comprovante mostrado na página de agradecimento. */
export interface CheckoutReceipt {
  paymentId: string;
  status: string;
  paid: boolean;
  method: CheckoutPaymentMethod | null;
  /** Valor formatado, ex.: "R$ 680,40". */
  amount: string;
  installments: number;
  paidAt: string | null;
}
