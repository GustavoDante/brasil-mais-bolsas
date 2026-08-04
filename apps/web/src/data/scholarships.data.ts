/**
 * Camada de dados de bolsas — é o que as páginas devem importar.
 *
 * Enquanto `NEXT_PUBLIC_USE_MOCKS` não for "false", tudo aqui devolve os dados de
 * `src/mocks`. Ao ligar a API, nenhum componente muda: só o caminho interno destas
 * funções. Componentes nunca importam `@/lib/api` nem `@/mocks` diretamente.
 */
import { api, apiConfig } from "@/lib/api";
import type { ScholarshipDto } from "@/lib/api/dto";
import { toBolsaCard, toBolsaDetail, toScholarshipCard } from "@/lib/mappers/scholarship.mapper";
import { getBolsaDetail as getMockBolsaDetail } from "@/mocks/bolsa-details.mock";
import { bolsas as mockBolsas } from "@/mocks/bolsas.mock";
import { scholarshipCards as mockScholarshipCards } from "@/mocks/scholarships.mock";
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
function applyLocalFilters(items: BolsaCardData[], filters: BolsaFilters): BolsaCardData[] {
  return items.filter((bolsa) => {
    if (filters.course && bolsa.course !== filters.course) return false;
    if (filters.college && bolsa.school !== filters.college) return false;
    if (filters.city && bolsa.city !== filters.city) return false;
    if (
      filters.modalidades &&
      filters.modalidades.length > 0 &&
      !filters.modalidades.includes(bolsa.modalidade)
    ) {
      return false;
    }
    return true;
  });
}

/** Listagem principal da página de bolsas. */
export async function listBolsas(filters: BolsaFilters = {}): Promise<BolsaCardData[]> {
  if (apiConfig.useMocks) {
    return applyLocalFilters(mockBolsas, filters);
  }

  const { scholarships } = await api.scholarships.listOrder({
    course: filters.course,
    institution: filters.college,
    city: filters.city,
    category: filters.category,
    alreadyListed: filters.alreadyListed,
    // Só faz sentido enviar `type` quando há exatamente uma modalidade marcada.
    type: filters.modalidades?.length === 1 ? toApiType(filters.modalidades[0]) : undefined,
  });

  return applyLocalFilters(scholarships.map(toBolsaCard), {
    modalidades: filters.modalidades,
  });
}

/** Destaques da home (bolsas aleatórias). */
export async function listBolsasDestaque(
  filters: BolsaFilters = {}
): Promise<BolsaCardData[]> {
  if (apiConfig.useMocks) {
    return applyLocalFilters(mockBolsas, filters).slice(0, 3);
  }

  const { scholarships } = await api.scholarships.listRandom({
    city: filters.city,
    category: filters.category,
    course: filters.course,
    institution: filters.college,
    alreadyListed: filters.alreadyListed,
  });

  return scholarships.map(toBolsaCard);
}

/** Cards compactos do carrossel da home. */
export async function listScholarshipCards(): Promise<ScholarshipCardData[]> {
  if (apiConfig.useMocks) return mockScholarshipCards;

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
  if (apiConfig.useMocks) return getMockBolsaDetail(id);

  const [{ scholarships }, faq] = await Promise.all([
    api.scholarships.listOrder({}),
    listFaq().catch(() => []),
  ]);

  const found: ScholarshipDto | undefined = scholarships.find((item) => item.id === id);
  if (!found) return null;

  return toBolsaDetail(found, { faq });
}

/** Ids usados por `generateStaticParams` na rota `/bolsas/[slug]`. */
export async function listBolsaIds(): Promise<string[]> {
  if (apiConfig.useMocks) return mockBolsas.map((bolsa) => bolsa.id);

  const { scholarships } = await api.scholarships.listOrder({});
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
