import type {
  CourseDto,
  HomeShowcaseItemDto,
  ScholarshipDto,
  ScholarshipTypeDto,
} from "@/lib/api/dto";
import { formatBRL, formatCity, formatShift, splitBRL, toNumber } from "@/lib/format";
import { resolveImageUrl } from "@/lib/images";
import type {
  BolsaCardData,
  BolsaDetailData,
  BolsaFaqItem,
  BolsaModalidade,
  ScholarshipCardData,
} from "@/types/scholarship";

/**
 * Traduz a bolsa da API (snake_case, Decimal como string) para o modelo que os
 * componentes usam.
 *
 * Regras de negócio assumidas aqui — confirmar com o time antes de ligar a API em
 * produção, estão isoladas de propósito:
 * - `discount` é percentual (é assim que o backend calcula `final_price`);
 * - a economia total considera a duração do curso (`course.duration`/`duration_type`),
 *   caindo para 12 meses quando o curso não informa duração;
 * - "últimas vagas" = restam `LAST_SPOTS_THRESHOLD` vagas ou menos.
 */

const LAST_SPOTS_THRESHOLD = 5;
const FALLBACK_DURATION_MONTHS = 12;

const PLACEHOLDER_LOGO = "/mock/school-logo.png";
const PLACEHOLDER_BANNER = "/hero.png";
const PLACEHOLDER_MAP = "/mock/campus-map.png";
const PLACEHOLDER_GALLERY_FEATURED = "/mock/campus-featured.png";

const MODALIDADE_BY_TYPE: Record<ScholarshipTypeDto, BolsaModalidade> = {
  PRESENCIAL: "Presencial",
  SEMI_PRESENCIAL: "Semi",
  EAD: "EaD",
};

export function toModalidade(type: ScholarshipTypeDto | null | undefined): BolsaModalidade {
  return type ? (MODALIDADE_BY_TYPE[type] ?? "Presencial") : "Presencial";
}

/** Duração do curso convertida em meses (a base guarda dias, meses ou anos). */
export function courseDurationInMonths(course: CourseDto | null | undefined): number {
  if (!course?.duration) return FALLBACK_DURATION_MONTHS;

  switch (course.duration_type) {
    case "YEARS":
      return course.duration * 12;
    case "DAYS":
      return Math.max(1, Math.round(course.duration / 30));
    case "MONTHS":
    default:
      return course.duration;
  }
}

export function toBolsaCard(dto: ScholarshipDto): BolsaCardData {
  const fullPrice = toNumber(dto.full_price);
  const finalPrice = toNumber(dto.final_price);
  const months = courseDurationInMonths(dto.course);
  const savings = Math.max(0, (fullPrice - finalPrice) * months);

  const discounted = splitBRL(finalPrice);
  const totalSavings = splitBRL(savings);

  const city = formatCity(dto.institution?.city);
  const district = normalizeDistrict(dto.institution?.district);
  const state = dto.institution?.state?.trim();

  const remainingSpots = dto.quantity_offered - (dto.payments_count ?? 0);

  return {
    id: dto.id,
    course: dto.course?.name ?? "",
    school: dto.institution?.name ?? "",
    schoolLogo: resolveImageUrl(dto.institution?.image, PLACEHOLDER_LOGO),
    bannerImage: PLACEHOLDER_BANNER,
    city: state ? `${city}, ${state}` : city,
    neighborhood: district ? `${city} – ${district}` : city,
    modalidade: toModalidade(dto.type),
    shift: formatShift(dto.shift),
    period: dto.period ?? "",
    originalPrice: formatBRL(fullPrice),
    discountedPrice: discounted.amount,
    discountedPriceCents: discounted.cents,
    discountPercent: Math.round(toNumber(dto.discount)),
    totalSavings: totalSavings.amount,
    totalSavingsCents: totalSavings.cents,
    lastSpots: remainingSpots > 0 && remainingSpots <= LAST_SPOTS_THRESHOLD,
  };
}

/**
 * Detalhe da bolsa.
 *
 * A API cobre curso, instituição, preços e descrição; conteúdo editorial (galeria, mapa,
 * texto institucional) ainda não existe no backend e usa os mesmos placeholders do mock.
 */
export function toBolsaDetail(
  dto: ScholarshipDto,
  { faq = [] }: { faq?: BolsaFaqItem[] } = {}
): BolsaDetailData {
  const card = toBolsaCard(dto);
  const schoolShortName = shortenSchoolName(card.school);
  const months = courseDurationInMonths(dto.course);

  return {
    ...card,
    schoolShortName,
    breadcrumb: ["Bolsas de estudo", "Faculdades e universidades", schoolShortName, card.course],
    title: `${card.course} na ${card.school}`,
    courseDescription: dto.course_description ?? "",
    startDate: dto.register_period_start
      ? new Date(dto.register_period_start).toLocaleDateString("pt-BR")
      : "Início imediato",
    duration: `${months} ${months === 1 ? "mês" : "meses"}`,
    faq,
    mapImage: PLACEHOLDER_MAP,
    aboutDescription: "",
    galleryFeatured: PLACEHOLDER_GALLERY_FEATURED,
    gallery: [],
  };
}

/**
 * A base migrada usa marcadores como "n/d" e "-" quando o bairro não foi preenchido —
 * eles não devem aparecer na interface.
 */
const EMPTY_MARKERS = new Set(["n/d", "nd", "n/a", "-", "--", "não informado", "nao informado"]);

function normalizeDistrict(district: string | null | undefined): string {
  const value = district?.trim();
  if (!value) return "";
  return EMPTY_MARKERS.has(value.toLocaleLowerCase("pt-BR")) ? "" : value;
}

/** "FAP - Faculdade dos Palmares" → "FAP" */
export function shortenSchoolName(name: string): string {
  const [prefix] = name.split(" - ");
  return prefix?.trim() || name;
}

/**
 * Card compacto do carrossel da home.
 * A rota `list/index` devolve a instituição com o menor preço e o maior desconto dela.
 */
export function toScholarshipCard(dto: HomeShowcaseItemDto): ScholarshipCardData {
  return {
    id: dto.id,
    school: dto.name,
    discount: `${Math.round(toNumber(dto.discount))}%`,
    priceFrom: formatBRL(dto.final_price),
    image: resolveImageUrl(dto.image, PLACEHOLDER_LOGO),
  };
}
