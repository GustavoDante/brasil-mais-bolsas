/**
 * Ponto de entrada da integração com a API.
 *
 * ```ts
 * import { api } from "@/lib/api";
 * const { scholarships } = await api.scholarships.listRandom({ city: "Recife" });
 * ```
 *
 * Para rotas autenticadas em Server Components/Server Actions use `getServerApi()`
 * (`@/lib/api/server`), que injeta o token do cookie de sessão.
 */
import { authResource } from "./resources/auth";
import { courseCategoriesResource, coursesResource, faqResource } from "./resources/catalog";
import { leadsResource } from "./resources/leads";
import { scholarshipsResource } from "./resources/scholarships";

export const api = {
  auth: authResource,
  scholarships: scholarshipsResource,
  courses: coursesResource,
  courseCategories: courseCategoriesResource,
  faq: faqResource,
  leads: leadsResource,
} as const;

export { apiConfig, apiUrl, cacheTags } from "./config";
export { ApiError, isApiError, toUserMessage } from "./errors";
export { apiRequest } from "./http";
export type { ApiRequestOptions, HttpMethod } from "./http";
export type { ScholarshipListParams } from "./resources/scholarships";
export type { LoginPayload } from "./resources/auth";
export type * from "./dto";
