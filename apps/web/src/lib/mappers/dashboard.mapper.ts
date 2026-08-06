import type { InstitutionDto, OrderDto, ScholarshipFullDto } from "@/lib/api/dto";
import type {
  RecentOrderRow,
  StudentScholarshipSummary,
} from "@/types/dashboard";

/**
 * DTOs dos painéis → modelos de UI.
 *
 * As rotas do backoffice devolvem entidades completas com relacionamentos opcionais (o
 * `include` varia por rota), então tudo aqui trata ausência: um `null` de relacionamento é
 * dado normal, não erro.
 */

/** Um pedido está pago quando existe pagamento com status `PAID`. */
function isPaid(order: OrderDto): boolean {
  return (order.payments ?? []).some((payment) => payment.status === "PAID");
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function toRecentOrderRow(order: OrderDto): RecentOrderRow {
  return {
    id: order.id,
    studentName: order.user?.name ?? null,
    scholarshipTitle: order.scholarship?.course?.name ?? null,
    institutionName: order.scholarship?.institution?.name ?? null,
    createdAt: toIsoString(order.created_at),
    paid: isPaid(order),
  };
}

export function toRecentOrderRows(orders: OrderDto[]): RecentOrderRow[] {
  return orders.map(toRecentOrderRow);
}

/**
 * A bolsa "atual" do aluno é a do pedido mais recente **não expirado**; se todos
 * expiraram, o mais recente serve para a tela poder falar da renovação em vez de fingir
 * que a pessoa nunca teve bolsa.
 */
export function toStudentScholarship(
  orders: OrderDto[],
): StudentScholarshipSummary | null {
  const current = orders.find((order) => !order.expired) ?? orders[0];
  if (!current) return null;

  return {
    orderId: current.id,
    scholarshipTitle: current.scholarship?.course?.name ?? null,
    institutionName: current.scholarship?.institution?.name ?? null,
    courseName: current.scholarship?.course?.name ?? null,
    paid: isPaid(current),
    expired: current.expired,
    scholarshipId: current.scholarship?.id ?? current.scholarship_id ?? null,
  };
}

/** Soma um agregado opcional; o campo não vem em toda resposta (ver `InstitutionDto`). */
function sumBy<T>(items: T[], pick: (item: T) => number | undefined): number {
  return items.reduce((total, item) => total + (pick(item) ?? 0), 0);
}

export function sumOfferedScholarships(institutions: InstitutionDto[]): number {
  return sumBy(institutions, (institution) => institution.offered_scholarships);
}

export function sumSoldScholarships(institutions: InstitutionDto[]): number {
  return sumBy(institutions, (institution) => institution.scholarships_sold);
}

export function sumQuantitySold(scholarships: ScholarshipFullDto[]): number {
  return sumBy(scholarships, (scholarship) => scholarship.quantity_sold);
}
