import { cacheTags } from "../config";
import type {
  CityListResponseDto,
  CourseListResponseDto,
  HomeShowcaseResponseDto,
  InstitutionListResponseDto,
  ScholarshipListResponseDto,
  ScholarshipResponseDto,
} from "../dto";
import { apiRequest, type ApiRequestOptions } from "../http";

/** Filtros aceitos pelas listagens públicas de bolsas (`ScholarshipListQueryDto`). */
export interface ScholarshipListParams {
  /** Ids já exibidos, para não repetir em carregamentos incrementais. */
  alreadyListed?: string[];
  /** `PRESENCIAL` | `SEMI_PRESENCIAL` | `EAD` | `todos` */
  type?: string;
  institution?: string;
  city?: string;
  category?: string;
  course?: string;
}

type RequestContext = Pick<ApiRequestOptions, "signal" | "revalidate" | "token">;

const listTags = [cacheTags.scholarships];

export const scholarshipsResource = {
  /** Bolsas aleatórias — usado nos destaques da home. */
  listRandom(params: ScholarshipListParams = {}, ctx: RequestContext = {}) {
    return apiRequest<ScholarshipListResponseDto>("/scholarships/list/random", {
      query: { ...params },
      tags: listTags,
      ...ctx,
    });
  },

  /** Listagem ordenada por categoria — usado na página de bolsas. */
  listOrder(params: ScholarshipListParams = {}, ctx: RequestContext = {}) {
    return apiRequest<ScholarshipListResponseDto>("/scholarships/list/order", {
      query: { ...params },
      tags: listTags,
      ...ctx,
    });
  },

  /**
   * Vitrine da home: menor mensalidade e maior desconto por instituição.
   * Atenção: os itens são instituições (`HomeShowcaseItemDto`), não bolsas completas.
   */
  listIndex(ctx: RequestContext = {}) {
    return apiRequest<HomeShowcaseResponseDto>("/scholarships/list/index", {
      tags: listTags,
      ...ctx,
    });
  },

  /** Detalhe por id do sistema antigo (rota pública). */
  getByOldId(oldId: string, ctx: RequestContext = {}) {
    return apiRequest<ScholarshipResponseDto>(`/scholarships/old_id/${encodeURIComponent(oldId)}`, {
      tags: [cacheTags.scholarship(oldId)],
      ...ctx,
    });
  },

  /** Detalhe por id (rota autenticada — exige token). */
  getById(id: string, ctx: RequestContext = {}) {
    return apiRequest<ScholarshipResponseDto>(`/scholarships/${encodeURIComponent(id)}`, {
      tags: [cacheTags.scholarship(id)],
      ...ctx,
    });
  },

  searchCity(term: string, ctx: RequestContext = {}) {
    return apiRequest<CityListResponseDto>("/scholarships/search/city", {
      query: { term },
      tags: [cacheTags.cities],
      ...ctx,
    });
  },

  listCities(ctx: RequestContext = {}) {
    return apiRequest<CityListResponseDto>("/scholarships/list/city", {
      tags: [cacheTags.cities],
      ...ctx,
    });
  },

  searchInstitution(term: string, ctx: RequestContext = {}) {
    return apiRequest<InstitutionListResponseDto>("/scholarships/search/institution", {
      query: { term },
      tags: [cacheTags.institutions],
      ...ctx,
    });
  },

  listInstitutionsByCity(city: string, category: string, ctx: RequestContext = {}) {
    return apiRequest<InstitutionListResponseDto>("/scholarships/list/institution/bycity", {
      query: { city, category },
      tags: [cacheTags.institutions],
      ...ctx,
    });
  },

  searchCourse(term: string, ctx: RequestContext = {}) {
    return apiRequest<CourseListResponseDto>("/scholarships/search/course", {
      query: { term },
      tags: [cacheTags.courses],
      ...ctx,
    });
  },

  listCoursesByCity(city: string, category: string, ctx: RequestContext = {}) {
    return apiRequest<CourseListResponseDto>("/scholarships/list/course/bycity", {
      query: { city, category },
      tags: [cacheTags.courses],
      ...ctx,
    });
  },
};
