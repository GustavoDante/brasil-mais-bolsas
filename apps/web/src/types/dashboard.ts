/**
 * Modelos de UI dos painéis (camelCase).
 *
 * Os DTOs da API são snake_case e chegam de rotas diferentes; a conversão acontece só em
 * `lib/mappers/dashboard.mapper.ts`. Componente nunca vê `snake_case`.
 */

/** Um número do painel, com o rótulo que explica o que ele é. */
export interface KpiValue {
  label: string;
  value: number;
  /** Contexto quando o número tem recorte — ex.: "próximos 30 dias". */
  hint?: string;
}

/** Linha da lista de pedidos recentes, comum aos três painéis. */
export interface RecentOrderRow {
  id: string;
  studentName: string | null;
  scholarshipTitle: string | null;
  institutionName: string | null;
  createdAt: string | null;
  /** `true` quando existe pagamento com status `PAID`. */
  paid: boolean;
}

export interface AdminOverview {
  kpis: KpiValue[];
  recentOrders: RecentOrderRow[];
}

export interface ManagerOverview {
  institutionName: string | null;
  institutionCity: string | null;
  kpis: KpiValue[];
  recentOrders: RecentOrderRow[];
}

/** A bolsa que o aluno tem hoje, montada a partir do pedido mais recente. */
export interface StudentScholarshipSummary {
  orderId: string;
  scholarshipTitle: string | null;
  institutionName: string | null;
  courseName: string | null;
  paid: boolean;
  expired: boolean;
  /** Bolsa paga tem voucher para apresentar na instituição. */
  scholarshipId: string | null;
}

export interface StudentOverview {
  currentScholarship: StudentScholarshipSummary | null;
  kpis: KpiValue[];
}
