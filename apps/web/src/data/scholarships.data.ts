/**
 * Camada de dados de bolsas — é o que as páginas devem importar.
 *
 * Componentes nunca importam `@/lib/api` diretamente: tudo que a UI lê passa por aqui,
 * já convertido para os modelos de `src/types` pelos mappers.
 */
import { api, apiConfig } from "@/lib/api";
import type { ScholarshipDto } from "@/lib/api/dto";
import { toBolsaCard, toBolsaDetail, toScholarshipCard } from "@/lib/mappers/scholarship.mapper";
import type {
  BolsaCardData,
  BolsaDetailData,
  BolsaFilters,
  BolsaModalidade,
  ScholarshipCardData,
} from "@/types/scholarship";
import { listFaq } from "./faq.data";

/**
 * Filtro aplicado no cliente. A API filtra curso/instituição/cidade/categoria, mas a
 * modalidade é múltipla na UI e única (`type`) na query da API.
 */
function applyModalidadeFilter(
  items: BolsaCardData[],
  modalidades: BolsaModalidade[] | undefined
): BolsaCardData[] {
  if (!modalidades || modalidades.length === 0) return items;
  return items.filter((bolsa) => modalidades.includes(bolsa.modalidade));
}

/** Query da listagem completa, na forma que `GET /scholarships/list/order` espera. */
function toListQuery(filters: BolsaFilters) {
  return {
    course: filters.course,
    institution: filters.college,
    city: filters.city,
    category: filters.category,
    alreadyListed: filters.alreadyListed,
    // Só faz sentido enviar `type` quando há exatamente uma modalidade marcada.
    type: filters.modalidades?.length === 1 ? toApiType(filters.modalidades[0]) : undefined,
  };
}

type ListQuery = ReturnType<typeof toListQuery>;

/**
 * Memória de processo da última listagem.
 *
 * `list/order` não pagina: devolve todas as bolsas ativas de uma vez, hoje ~5 MB. Isso
 * passa do limite de 2 MB por entrada do cache de fetch do Next, então **o Next não
 * guarda essa resposta** — sem esta memória, cada página renderizada baixa o catálogo
 * inteiro de novo. No build isso são centenas de downloads em segundos, o suficiente
 * para o rate limit da API responder 429 e derrubar o `next build`.
 *
 * Uma entrada só: a listagem sem filtro é o caso dominante (detalhe, sitemap,
 * `generateStaticParams`) e uma busca filtrada não deve manter 5 MB vivos. Some quando
 * o backend paginar `list/order` — é o motivo de existir.
 */
let catalogCache: { key: string; at: number; promise: Promise<ScholarshipDto[]> } | null =
  null;

function loadScholarships(query: ListQuery): Promise<ScholarshipDto[]> {
  const key = JSON.stringify(query);
  const ttlMs = apiConfig.revalidateSeconds * 1000;
  const now = Date.now();

  if (catalogCache && catalogCache.key === key && now - catalogCache.at < ttlMs) {
    return catalogCache.promise;
  }

  const promise = api.scholarships
    .listOrder(query)
    .then((response) => response.scholarships);

  // Uma falha não pode ficar grudada na memória pelo TTL inteiro.
  promise.catch(() => {
    if (catalogCache?.promise === promise) catalogCache = null;
  });

  catalogCache = { key, at: now, promise };
  return promise;
}

/** Listagem principal da página de bolsas. */
export async function listBolsas(filters: BolsaFilters = {}): Promise<BolsaCardData[]> {
  const scholarships = await loadScholarships(toListQuery(filters));

  return applyModalidadeFilter(scholarships.map(toBolsaCard), filters.modalidades);
}

/** Destaques da home (bolsas aleatórias). */
export async function listBolsasDestaque(
  filters: BolsaFilters = {}
): Promise<BolsaCardData[]> {
  const { scholarships } = await api.scholarships.listRandom({
    city: filters.city,
    category: filters.category,
    course: filters.course,
    institution: filters.college,
    alreadyListed: filters.alreadyListed,
  });

  return scholarships.map(toBolsaCard);
}

/**
 * Cards compactos dos carrosséis (home e "quem viu também").
 *
 * Atenção: `list/index` devolve **instituições** — a de menor mensalidade com o maior
 * desconto de cada uma —, não bolsas. É por isso que o card mostra "a partir de".
 */
export async function listScholarshipCards(): Promise<ScholarshipCardData[]> {
  const { scholarships } = await api.scholarships.listIndex();
  return scholarships.map(toScholarshipCard);
}

/**
 * Detalhe da bolsa.
 *
 * A API ainda não expõe uma rota pública de detalhe (`GET /v1/scholarships/:id` exige
 * token), então o detalhe é resolvido a partir da listagem pública, que já traz curso,
 * instituição e preços. Quando o backend publicar a rota, troque por
 * `api.scholarships.getById(id)` — o restante desta função continua válido.
 */
export async function getBolsaDetail(id: string): Promise<BolsaDetailData | null> {
  const [scholarships, faq] = await Promise.all([
    loadScholarships(toListQuery({})),
    listFaq().catch(() => []),
  ]);

  const found: ScholarshipDto | undefined = scholarships.find((item) => item.id === id);
  if (!found) return null;

  return toBolsaDetail(found, { faq });
}

/** Ids usados por `generateStaticParams` na rota `/bolsas/[slug]`. */
export async function listBolsaIds(): Promise<string[]> {
  const scholarships = await loadScholarships(toListQuery({}));
  return scholarships.map((item) => item.id);
}

function toApiType(modalidade: BolsaModalidade | undefined): string | undefined {
  switch (modalidade) {
    case "Presencial":
      return "PRESENCIAL";
    case "Semi":
      return "SEMI_PRESENCIAL";
    case "EaD":
      return "EAD";
    default:
      return undefined;
  }
}
