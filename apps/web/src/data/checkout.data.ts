import { getPayment } from "@/actions/payments";
import { getMe } from "@/actions/users";
import { toCheckoutCustomerPrefill, toCheckoutReceipt } from "@/lib/mappers/checkout.mapper";
import type { CheckoutCustomerPrefill, CheckoutReceipt } from "@/types/checkout";

/**
 * Dados que as telas de assinatura consomem.
 *
 * Compõe as actions que já existem (`GET /users/me`, `GET /payment/:id`) em vez de abrir um
 * segundo transporte para as mesmas rotas — mesma decisão de `dashboard.data.ts`. A
 * fronteira que as páginas enxergam continua sendo `@/data`.
 */

/**
 * Dados do aluno logado para preencher o primeiro passo.
 *
 * Devolve `null` quando não há sessão ou a leitura falha: o formulário simplesmente começa
 * do passo de cadastro, que é o comportamento correto para quem não está autenticado.
 */
export async function getCheckoutCustomerPrefill(): Promise<CheckoutCustomerPrefill | null> {
  const result = await getMe();

  return result.ok ? toCheckoutCustomerPrefill(result.data) : null;
}

/** Comprovante da página de agradecimento — `null` quando o pagamento não é do usuário. */
export async function getCheckoutReceipt(
  paymentId: string,
): Promise<CheckoutReceipt | null> {
  const result = await getPayment({ id: paymentId });

  return result.ok ? toCheckoutReceipt(result.data) : null;
}
