/**
 * Contrato da query string da listagem de bolsas (`/bolsas`).
 *
 * Fonte única de verdade para servidor (page/generateMetadata) e cliente (formulário
 * de filtros e painel de busca). Os nomes dos parâmetros são públicos: aparecem na URL,
 * são copiados/compartilhados pelo usuário e chegam no analytics como dimensão de
 * busca — só mude com migração planejada.
 *
 * Duas regras sustentam a métrica:
 * 1. `buildBolsasHref` sempre serializa na mesma ordem, então o mesmo conjunto de
 *    filtros gera exatamente a mesma URL (relatórios agregam sem normalização).
 * 2. Valores inválidos são descartados na leitura, para não indexar nem medir lixo.
 */
import type { BolsaFilters, BolsaModalidade } from "@/types/scholarship";

/** Chaves em pt-BR, iguais às da URL. */
export const BOLSAS_PARAMS = {
  course: "curso",
  college: "faculdade",
  city: "cidade",
  modalidade: "modalidade",
  page: "pagina",
} as const;

export const BOLSA_MODALIDADES: BolsaModalidade[] = ["Presencial", "Semi", "EaD"];

/** Itens por página da listagem. */
export const BOLSAS_PAGE_SIZE = 12;

export interface BolsasSearch {
  course: string;
  college: string;
  city: string;
  modalidades: BolsaModalidade[];
  page: number;
}

/** Forma do `searchParams` recebido pelas páginas do App Router. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export const EMPTY_BOLSAS_SEARCH: BolsasSearch = {
  course: "",
  college: "",
  city: "",
  modalidades: [],
  page: 1,
};

function firstValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

function isModalidade(value: string): value is BolsaModalidade {
  return (BOLSA_MODALIDADES as string[]).includes(value);
}

/**
 * Lê a query string (servidor ou cliente) e devolve o estado de busca normalizado.
 * Aceita tanto o objeto do App Router quanto um `URLSearchParams`.
 */
export function parseBolsasSearch(
  input: RawSearchParams | URLSearchParams
): BolsasSearch {
  const get = (key: string): string =>
    input instanceof URLSearchParams
      ? (input.get(key)?.trim() ?? "")
      : firstValue(input[key]);

  const modalidades = get(BOLSAS_PARAMS.modalidade)
    .split(",")
    .map((item) => item.trim())
    .filter(isModalidade);

  const page = Number.parseInt(get(BOLSAS_PARAMS.page), 10);

  // Remove duplicatas e mantém a ordem canônica de `BOLSA_MODALIDADES`. Todas
  // marcadas equivale a nenhuma — normalizar aqui faz o formulário, o título, o
  // canonical e o analytics enxergarem o mesmo estado.
  const selectedModalidades = BOLSA_MODALIDADES.filter((item) =>
    modalidades.includes(item)
  );

  return {
    course: get(BOLSAS_PARAMS.course),
    college: get(BOLSAS_PARAMS.college),
    city: get(BOLSAS_PARAMS.city),
    modalidades:
      selectedModalidades.length === BOLSA_MODALIDADES.length ? [] : selectedModalidades,
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

/**
 * Monta a URL da listagem a partir do estado de busca. A ordem das chaves é fixa e
 * valores vazios são omitidos — mesma busca, mesma URL, sempre.
 */
export function buildBolsasHref(
  search: Partial<BolsasSearch>,
  pathname = "/bolsas"
): string {
  const params = new URLSearchParams();

  if (search.course) params.set(BOLSAS_PARAMS.course, search.course);
  if (search.college) params.set(BOLSAS_PARAMS.college, search.college);
  if (search.city) params.set(BOLSAS_PARAMS.city, search.city);
  // Marcar todas as modalidades equivale a não filtrar — omitir mantém a URL curta,
  // evita uma faceta a mais no SEO e não polui a dimensão do analytics.
  const modalidades = BOLSA_MODALIDADES.filter((item) =>
    search.modalidades?.includes(item)
  );
  if (modalidades.length > 0 && modalidades.length < BOLSA_MODALIDADES.length) {
    params.set(BOLSAS_PARAMS.modalidade, modalidades.join(","));
  }
  if (search.page && search.page > 1) {
    params.set(BOLSAS_PARAMS.page, String(search.page));
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

/** Converte o estado da URL nos filtros que `src/data` entende. */
export function toBolsaFilters(search: BolsasSearch): BolsaFilters {
  return {
    course: search.course || undefined,
    college: search.college || undefined,
    city: search.city || undefined,
    modalidades: search.modalidades.length > 0 ? search.modalidades : undefined,
  };
}

/** Quantos filtros (fora paginação) estão ativos — usado no SEO e no analytics. */
export function countActiveFilters(search: BolsasSearch): number {
  return (
    (search.course ? 1 : 0) +
    (search.college ? 1 : 0) +
    (search.city ? 1 : 0) +
    (search.modalidades.length > 0 ? 1 : 0)
  );
}
