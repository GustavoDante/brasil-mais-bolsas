import { apiConfig, apiUrl } from "./config";
import { ApiError } from "./errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export interface ApiRequestOptions {
  method?: HttpMethod;
  /** Query string. Valores `undefined`, `null` e `""` são descartados. */
  query?: Record<string, QueryValue>;
  /** Corpo JSON. */
  body?: unknown;
  /**
   * Access token. No servidor use `getServerApi()` (lê o cookie sozinho);
   * no cliente, prefira Server Actions a manipular token.
   */
  token?: string | null;
  /**
   * Cache do Next: segundos de revalidação ou `false` para `no-store`.
   * Requisições autenticadas e mutações usam `false` por padrão.
   */
  revalidate?: number | false;
  /** Tags de cache para `revalidateTag`. */
  tags?: string[];
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildQueryString(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        params.append(key, String(item));
      }
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function resolveSignal(signal: AbortSignal | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(apiConfig.timeoutMs);
  if (!signal) return timeout;
  return AbortSignal.any([signal, timeout]);
}

function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.length > 0) return body;

  if (body && typeof body === "object") {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string") return message;
    // class-validator devolve `message` como array de strings
    if (Array.isArray(message) && message.length > 0) return message.join("; ");
  }

  return fallback;
}

/**
 * Cliente HTTP da API. Isomórfico: funciona em Server Components, Server Actions,
 * Route Handlers e no browser. Não lê cookies — quem tem sessão passa o `token`
 * (veja `lib/api/server.ts`).
 */
export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const { method = "GET", query, body, token, revalidate, tags, headers } = options;

  const url = `${apiUrl(path)}${buildQueryString(query)}`;
  const isMutation = method !== "GET";
  const noStore = revalidate === false || isMutation || Boolean(token);

  const requestHeaders: Record<string, string> = {
    accept: "application/json",
    ...headers,
  };
  if (body !== undefined) requestHeaders["content-type"] = "application/json";
  if (token) requestHeaders.authorization = `Bearer ${token}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: resolveSignal(options.signal),
      ...(noStore
        ? { cache: "no-store" as const }
        : {
            next: {
              revalidate: revalidate ?? apiConfig.revalidateSeconds,
              ...(tags && tags.length > 0 ? { tags } : {}),
            },
          }),
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    throw new ApiError({
      kind: isTimeout ? "timeout" : "network",
      status: 0,
      message: isTimeout
        ? `Timeout de ${apiConfig.timeoutMs}ms em ${method} ${path}`
        : `Falha de rede em ${method} ${path}`,
      path,
      cause: error,
    });
  }

  if (response.status === 204) return undefined as TResponse;

  const raw = await response.text();
  let parsed: unknown = null;

  if (raw.length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      if (response.ok) {
        throw new ApiError({
          kind: "parse",
          status: response.status,
          message: `Resposta inválida (JSON) em ${method} ${path}`,
          path,
          body: raw,
          cause: error,
        });
      }
      parsed = raw;
    }
  }

  if (!response.ok) {
    throw new ApiError({
      kind: "http",
      status: response.status,
      message: extractMessage(parsed, `${response.status} em ${method} ${path}`),
      path,
      body: parsed,
    });
  }

  return parsed as TResponse;
}
