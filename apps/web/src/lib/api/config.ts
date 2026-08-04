/**
 * Configuração da integração com a API (NestJS, prefixo /v1).
 *
 * As variáveis `NEXT_PUBLIC_*` são embutidas no bundle em tempo de build — não coloque
 * segredos aqui. Chamadas autenticadas usam o token do cookie, lido apenas no servidor
 * (`lib/api/session.ts`).
 */

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const apiConfig = {
  /** Origem da API, sem barra final. Ex.: http://localhost:3333 */
  baseUrl: normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"
  ),

  /** Prefixo global de versão configurado no `main.ts` da API. */
  prefix: "/v1",

  /** Timeout de cada requisição, em milissegundos. */
  timeoutMs: toNumber(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 15_000),

  /**
   * Enquanto `true`, a camada de dados (`src/data`) devolve os mocks de `src/mocks`
   * sem tocar na rede. Trocar para "false" liga a API de verdade — nenhuma página
   * precisa ser alterada.
   */
  useMocks: (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") !== "false",

  /** Revalidação padrão (em segundos) do cache de dados públicos de catálogo. */
  revalidateSeconds: toNumber(process.env.NEXT_PUBLIC_API_REVALIDATE, 300),

  /**
   * Base para imagens gravadas só com o nome do arquivo (uploads antigos da API legada).
   * Registros novos já trazem a URL completa do S3 e ignoram esta variável.
   */
  imagesBaseUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_IMAGES_BASE_URL ?? ""),

  /** Nome do cookie httpOnly onde o access token é guardado. */
  sessionCookieName: "bmb.session",
} as const;

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiConfig.baseUrl}${apiConfig.prefix}${normalizedPath}`;
}

/** Tags de cache usadas nas revalidações (`revalidateTag`). */
export const cacheTags = {
  scholarships: "scholarships",
  scholarship: (id: string) => `scholarship:${id}`,
  courses: "courses",
  courseCategories: "course-categories",
  institutions: "institutions",
  cities: "cities",
  faq: "faq",
} as const;
