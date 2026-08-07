import type {
  CheckoutPaymentMethodDto,
  CheckoutResultDto,
  PaymentDto,
  UserDto,
} from "@/lib/api/dto";
import { formatBRL } from "@/lib/format";
import type {
  CheckoutCharge,
  CheckoutCustomerPrefill,
  CheckoutReceipt,
} from "@/types/checkout";

/**
 * DTOs do checkout → modelos de UI.
 *
 * Status de pagamento é `string` livre no contrato (a coluna é texto no banco, herdada do
 * legado). O que significa "pago" está escrito uma vez só, aqui, com os mesmos valores que
 * o webhook da API considera baixa: `RECEIVED`, `CONFIRMED` e `RECEIVED_IN_CASH`.
 */
const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH", "PAID"]);

export function isPaidStatus(status: string | null | undefined): boolean {
  return status ? PAID_STATUSES.has(status.toUpperCase()) : false;
}

/** `Date` ou ISO string → `yyyy-MM-dd`, que é o que o `<input type="date">` aceita. */
function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function toCheckoutCustomerPrefill(user: UserDto): CheckoutCustomerPrefill {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    birthdate: toDateInputValue(user.birthdate),
    cpf: user.cpf ?? "",
    rg: user.rg ?? "",
    rgEmissor: user.rg_emissor ?? "",
    address: {
      street: user.address?.street ?? "",
      number: user.address?.number ?? "",
      complement: user.address?.complement ?? "",
      district: user.address?.district ?? "",
      city: user.address?.city ?? "",
      state: user.address?.state ?? "",
      postalCode: user.address?.postal_code ?? "",
    },
  };
}

export function toCheckoutCharge(result: CheckoutResultDto): CheckoutCharge {
  const { charge, payment } = result;

  return {
    paymentId: payment.id,
    method: charge.method,
    status: charge.status,
    paid: isPaidStatus(charge.status),
    invoiceUrl: charge.invoiceUrl ?? null,
    pixQrCodeImage: charge.pixQrCode?.encodedImage ?? null,
    pixCopyPaste: charge.pixQrCode?.payload ?? null,
    bankSlipUrl: charge.bankSlipUrl ?? null,
    barCode: charge.barCode ?? null,
  };
}

/**
 * O tipo do pagamento no banco tem valores que o checkout não gera (`INTEREST`,
 * `REFUNDED`, ...): quando for um deles, o comprovante mostra o método como desconhecido
 * em vez de mentir que foi PIX.
 */
function toCheckoutMethod(
  paymentType: PaymentDto["payment_type"],
): CheckoutPaymentMethodDto | null {
  return paymentType === "PIX" || paymentType === "CREDIT_CARD" || paymentType === "BOLETO"
    ? paymentType
    : null;
}

export function toCheckoutReceipt(payment: PaymentDto): CheckoutReceipt {
  return {
    paymentId: payment.id,
    status: payment.status,
    paid: isPaidStatus(payment.status),
    method: toCheckoutMethod(payment.payment_type),
    amount: formatBRL(payment.final_price),
    installments: payment.installment_count ?? 1,
    paidAt: toIsoString(payment.date_paid),
  };
}
