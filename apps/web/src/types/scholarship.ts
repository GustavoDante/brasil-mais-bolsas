/**
 * Modelos de domínio consumidos pela UI.
 *
 * São a fronteira entre a API e os componentes: tanto os mocks (`src/mocks`) quanto os
 * mappers (`src/lib/mappers`) produzem exatamente estas formas, então trocar mock por API
 * não muda nenhum componente.
 */

export type BolsaModalidade = "Presencial" | "Semi" | "EaD";

export interface BolsaCardData {
  id: string;
  course: string;
  school: string;
  schoolLogo: string;
  bannerImage: string;
  city: string;
  neighborhood: string;
  modalidade: BolsaModalidade;
  shift: string;
  period: string;
  /** Preço formatado, ex.: "R$ 972,00". */
  originalPrice: string;
  /** Parte inteira do preço com desconto, ex.: "R$ 680". */
  discountedPrice: string;
  /** Centavos do preço com desconto, ex.: ",40". */
  discountedPriceCents: string;
  discountPercent: number;
  totalSavings: string;
  totalSavingsCents: string;
  lastSpots: boolean;
}

export interface BolsaFaqItem {
  question: string;
  answer: string;
}

export interface BolsaDetailData extends BolsaCardData {
  /** Nome curto da escola, usado em títulos e navegação. */
  schoolShortName: string;
  breadcrumb: string[];
  title: string;
  courseDescription: string;
  startDate: string;
  duration: string;
  faq: BolsaFaqItem[];
  mapImage: string;
  aboutDescription: string;
  galleryFeatured: string;
  gallery: string[];
}

/** Filtros da listagem de bolsas (espelham a query string da página). */
export interface BolsaFilters {
  course?: string;
  college?: string;
  city?: string;
  category?: string;
  modalidades?: BolsaModalidade[];
  /** Ids já carregados, para paginação incremental. */
  alreadyListed?: string[];
}

/** Item usado nos carrosséis da home. */
export interface ScholarshipCardData {
  id: string;
  school: string;
  discount: string;
  priceFrom: string;
  image: string;
}

export interface CourseCategoryData {
  id: string;
  title: string;
  image: string;
}

export interface CityOption {
  name: string;
}

export interface NamedOption {
  id: string;
  name: string;
}
