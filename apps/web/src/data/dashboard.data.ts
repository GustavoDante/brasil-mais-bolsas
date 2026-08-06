import { actionDataOr } from "@/actions/_core";
import { listMyIndications } from "@/actions/indications";
import { listInstitutions } from "@/actions/institutions";
import { listNotifications } from "@/actions/notifications";
import { listOrders } from "@/actions/orders";
import { listDefaultersReport, listRenewalsReport } from "@/actions/reports";
import { listBackofficeScholarships } from "@/actions/scholarships";
import {
  sumOfferedScholarships,
  sumQuantitySold,
  sumSoldScholarships,
  toRecentOrderRows,
  toStudentScholarship,
} from "@/lib/mappers/dashboard.mapper";
import type {
  AdminOverview,
  ManagerOverview,
  StudentOverview,
} from "@/types/dashboard";

/**
 * Dados das telas de visão geral dos três painéis.
 *
 * Compõe as **actions** que já existem em vez de abrir recursos novos em `lib/api`: cada
 * rota da API já tem exatamente um transporte em `src/actions/<módulo>`, e um segundo
 * caminho para `/reports/students/defaulters` (por exemplo) seria mais um lugar para
 * atualizar quando um query param mudar. A fronteira que a página enxerga continua sendo
 * `@/data` — nada em `src/app` importa action de dashboard direto.
 *
 * Toda leitura passa por `actionDataOr(..., [])`: um relatório fora do ar derruba aquele
 * número para zero, não a página inteira. Painel meio preenchido é melhor que `error.tsx`.
 *
 * **Não existe endpoint de resumo na API.** Enquanto não existir, cada número aqui é o
 * `length` de uma listagem — ver as duas exclusões documentadas abaixo.
 */

/** Janela padrão das renovações mostradas no painel. */
const RENEWAL_WINDOW_DAYS = 30;

/** Quantos pedidos recentes cabem no painel sem virar uma tabela. */
const RECENT_ORDERS_LIMIT = 5;

export async function getAdminOverview(): Promise<AdminOverview> {
  const [institutions, defaulters, renewals, orders] = await Promise.all([
    listInstitutions().then((result) => actionDataOr(result, [])),
    listDefaultersReport().then((result) => actionDataOr(result, [])),
    listRenewalsReport({ days: RENEWAL_WINDOW_DAYS }).then((result) =>
      actionDataOr(result, []),
    ),
    listOrders({ page: 1, limit: RECENT_ORDERS_LIMIT }).then((result) =>
      actionDataOr(result, []),
    ),
  ]);

  // `GET /institutions` já devolve `offered_scholarships` e `scholarships_sold` por
  // instituição quando quem pede é admin: três números por uma requisição só.
  return {
    kpis: [
      { label: "Instituições", value: institutions.length },
      { label: "Bolsas ofertadas", value: sumOfferedScholarships(institutions) },
      { label: "Bolsas vendidas", value: sumSoldScholarships(institutions) },
      { label: "Inadimplentes", value: defaulters.length },
      {
        label: "Renovações",
        value: renewals.length,
        hint: `próximos ${RENEWAL_WINDOW_DAYS} dias`,
      },
    ],
    recentOrders: toRecentOrderRows(orders),
  };
}

/**
 * Painel do gestor.
 *
 * Todas as chamadas são as mesmas do admin: quem recorta por instituição é a **API**, que
 * lê `institution_id` do token. Sem essa claim (token emitido antes da correção), as rotas
 * respondem vazio — daí `institutionName` vir `null` ser um sinal útil, não um bug de tela.
 *
 * **"Meus alunos" não entra aqui de propósito.** `GET /reports/students` monta o `where`
 * como `{ delete: false, type: 'user' }` para todo mundo e só filtra a relação `orders` por
 * instituição — contar aquelas linhas mostraria o total de alunos da plataforma na tela de
 * um gestor. O número certo depende de um endpoint de resumo que ainda não existe.
 */
export async function getManagerOverview(): Promise<ManagerOverview> {
  const [institutions, scholarships, defaulters, renewals, orders] =
    await Promise.all([
      listInstitutions().then((result) => actionDataOr(result, [])),
      listBackofficeScholarships({}).then((result) => actionDataOr(result, [])),
      listDefaultersReport().then((result) => actionDataOr(result, [])),
      listRenewalsReport({ days: RENEWAL_WINDOW_DAYS }).then((result) =>
        actionDataOr(result, []),
      ),
      listOrders({ page: 1, limit: RECENT_ORDERS_LIMIT }).then((result) =>
        actionDataOr(result, []),
      ),
    ]);

  const institution = institutions[0] ?? null;

  return {
    institutionName: institution?.name ?? null,
    institutionCity: institution?.city ?? null,
    kpis: [
      { label: "Bolsas cadastradas", value: scholarships.length },
      { label: "Bolsas vendidas", value: sumQuantitySold(scholarships) },
      { label: "Inadimplentes", value: defaulters.length },
      {
        label: "Renovações",
        value: renewals.length,
        hint: `próximos ${RENEWAL_WINDOW_DAYS} dias`,
      },
    ],
    recentOrders: toRecentOrderRows(orders),
  };
}

/**
 * Painel do aluno.
 *
 * `GET /order` já vem escopado ao próprio `user_id` no servidor quando o papel é `user` —
 * não há filtro a passar daqui, e não deve haver.
 *
 * Nada de `/minors`, `/addresses` ou `/signed-contracts`: essas três rotas listam **tudo**,
 * sem recorte por usuário. Montar tela de aluno em cima delas exporia dado de terceiros.
 */
export async function getStudentOverview(): Promise<StudentOverview> {
  const [orders, indications, notifications] = await Promise.all([
    listOrders({ page: 1, limit: RECENT_ORDERS_LIMIT }).then((result) =>
      actionDataOr(result, []),
    ),
    listMyIndications().then((result) => actionDataOr(result, [])),
    listNotifications().then((result) => actionDataOr(result, [])),
  ]);

  return {
    currentScholarship: toStudentScholarship(orders),
    kpis: [
      { label: "Indicações feitas", value: indications.length },
      {
        label: "Notificações não lidas",
        value: notifications.filter((notification) => !notification.read).length,
      },
    ],
  };
}
