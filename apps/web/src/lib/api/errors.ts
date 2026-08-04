/**
 * Erros normalizados da API.
 *
 * O `AllExceptionsFilter` do backend responde sempre no formato
 * `{ ok: false, code, message, statusCode, timestamp, path, fieldErrors? }` — o `ApiError`
 * espelha isso e ainda cobre falhas de rede e timeout, que não têm resposta HTTP.
 */
import { ERROR_CATALOG, errorCodeForStatus } from "@repo/contracts";

export type ApiErrorKind = "http" | "network" | "timeout" | "parse";

interface ApiErrorParams {
  kind: ApiErrorKind;
  status: number;
  message: string;
  path?: string;
  /** Corpo original da resposta, quando houver. Útil para depurar. */
  body?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** Status HTTP; `0` quando a requisição nem chegou a ter resposta. */
  readonly status: number;
  readonly path?: string;
  readonly body?: unknown;

  constructor({ kind, status, message, path, body, cause }: ApiErrorParams) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.path = path;
    this.body = body;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** Erros de rede/timeout e 5xx costumam valer uma nova tentativa. */
  get isRetryable(): boolean {
    return this.kind === "network" || this.kind === "timeout" || this.status >= 500;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Mensagem pronta para exibir ao usuário — a que a API mandou.
 *
 * O texto de cada erro é definido uma vez só, no `ERROR_CATALOG` de `@repo/contracts`, e
 * chega serializado na resposta. Aqui não há tradução de código em mensagem: só o
 * transporte (rede/timeout) e a resposta sem corpo nosso precisam de texto local, e mesmo
 * esse último vem do catálogo, não de uma segunda lista.
 */
export function toUserMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação. Tente novamente."
): string {
  if (!isApiError(error)) return fallback;

  if (error.kind === "timeout") return "A operação demorou demais. Tente novamente.";
  if (error.kind === "network") return "Não foi possível conectar ao servidor.";

  const body = error.body;
  if (body && typeof body === "object") {
    const { message } = body as { message?: unknown };
    if (typeof message === "string" && message.length > 0) return message;
  }

  // Resposta sem o nosso corpo (proxy, balanceador). Só o status é confiável.
  return error.status > 0 ? ERROR_CATALOG[errorCodeForStatus(error.status)].message : fallback;
}
