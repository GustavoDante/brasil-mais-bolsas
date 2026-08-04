import { cacheTags } from "../config";
import type {
  CourseCategoryListResponseDto,
  CourseListResponseDto,
  FaqListResponseDto,
} from "../dto";
import { apiRequest, type ApiRequestOptions } from "../http";

type RequestContext = Pick<ApiRequestOptions, "signal" | "revalidate" | "token">;

export const courseCategoriesResource = {
  /** Categorias de curso (rota pública). */
  list(ctx: RequestContext = {}) {
    return apiRequest<CourseCategoryListResponseDto>("/course-categories", {
      tags: [cacheTags.courseCategories],
      ...ctx,
    });
  },
};

export const coursesResource = {
  /** Cursos oferecidos por uma instituição (rota pública). */
  listByInstitution(institutionId: string, ctx: RequestContext = {}) {
    return apiRequest<CourseListResponseDto>(
      `/courses/institution/${encodeURIComponent(institutionId)}`,
      { tags: [cacheTags.courses], ...ctx }
    );
  },
};

export const faqResource = {
  /** Perguntas frequentes (rota pública). */
  list(ctx: RequestContext = {}) {
    return apiRequest<FaqListResponseDto>("/faq", { tags: [cacheTags.faq], ...ctx });
  },
};
