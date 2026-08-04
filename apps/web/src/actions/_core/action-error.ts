import {
  ERROR_CATALOG,
  errorCodeForStatus,
  type ErrorCode,
  type FieldErrors,
} from "@repo/contracts";

import { ApiError, isApiError } from "@/lib/api/errors";

/**
 * Erro padronizado devolvido por qualquer action.
 *
 * `code` é o identificador estável — é nele que a UI decide comportamento, nunca no texto.
 * Como é uma união de literais vinda de `@repo/contracts`, comparar com um código que não
 * existe é erro de compilação.
 *
 * `message` é o texto pronto para exibir, e ele **vem da API**. Este arquivo não traduz
 * código em mensagem: quem define o texto é o `ERROR_CATALOG` do contrato, a API o
 * serializa na resposta e aqui ele só é repassado. Antes, o mesmo texto existia aqui e no
 * backend, e os dois divergiram.
 */
export interface ActionError {
  code: ErrorCode | TransportErrorCode;
  message: string;
  /** Status HTTP; `0` quando a requisição não chegou a ter resposta (rede/timeout). */
  status: number;
  /** Erros por campo, quando a validação (local ou do backend) falha. */
  fieldErrors?: FieldErrors;
  /** Corpo original do erro — só para log/depuração, não exibir. */
  details?: unknown;
}

/**
 * Os únicos códigos definidos aqui: as falhas em que **não existe resposta da API** para
 * repassar. Qualquer outro código vem do backend.
 */
export const TRANSPORT_ERRORS = {
  "network-error": "Não foi possível conectar ao servidor.",
  "timeout-error": "A operação demorou mais que o esperado. Tente novamente.",
  "not-authenticated": "Faça login para continuar.",
  "unknown-error": "Não foi possível concluir a operação. Tente novamente em instantes.",
} as const;

export type TransportErrorCode = keyof typeof TRANSPORT_ERRORS;

export const DEFAULT_ERROR_MESSAGE = TRANSPORT_ERRORS["unknown-error"];

/** Códigos gerados no próprio frontend (não vêm do backend). */
export const ACTION_ERROR_CODES = {
  validation: "validation-error",
  unauthenticated: "not-authenticated",
  network: "network-error",
  timeout: "timeout-error",
  unknown: "unknown-error",
} as const;

/**
 * Texto de um código sem passar pela rede. Usado só quando a resposta não trouxe
 * mensagem — erro de transporte, ou um 502 do proxy que devolve HTML em vez do nosso
 * corpo. É a mesma fonte que a API usa, então o texto não diverge.
 */
function messageFor(code: ErrorCode | TransportErrorCode): string {
  return code in TRANSPORT_ERRORS
    ? TRANSPORT_ERRORS[code as TransportErrorCode]
    : ERROR_CATALOG[code as ErrorCode].message;
}

export function buildActionError(params: {
  code: ErrorCode | TransportErrorCode;
  status?: number;
  message?: string;
  fieldErrors?: FieldErrors;
  details?: unknown;
}): ActionError {
  const { code, status = 0, message, fieldErrors, details } = params;

  return {
    code,
    message: message ?? messageFor(code),
    status,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(details !== undefined ? { details } : {}),
  };
}

/** Converte qualquer erro (HTTP, rede, timeout, exceção inesperada) no formato padrão. */
export function normalizeError(error: unknown): ActionError {
  if (isApiError(error)) return fromApiError(error);

  if (error instanceof Error) {
    return buildActionError({
      code: ACTION_ERROR_CODES.unknown,
      status: 0,
      details: error.message,
    });
  }

  return buildActionError({
    code: ACTION_ERROR_CODES.unknown,
    status: 0,
    details: error,
  });
}

/** O corpo de erro da API: `{ ok: false, code, message, fieldErrors? }`. */
interface ErrorBody {
  code?: unknown;
  message?: unknown;
  fieldErrors?: unknown;
}

function fromApiError(error: ApiError): ActionError {
  if (error.kind === "timeout") {
    return buildActionError({ code: ACTION_ERROR_CODES.timeout, status: 0 });
  }

  if (error.kind === "network") {
    return buildActionError({ code: ACTION_ERROR_CODES.network, status: 0 });
  }

  const body = (
    error.body && typeof error.body === "object" ? error.body : {}
  ) as ErrorBody;

  // Sem código no corpo, a resposta não veio da nossa API — é um proxy, um balanceador ou
  // um erro que não passou pelo filtro global. Só o status é confiável.
  const code =
    typeof body.code === "string" && body.code in ERROR_CATALOG
      ? (body.code as ErrorCode)
      : errorCodeForStatus(error.status);

  const message =
    typeof body.message === "string" && body.message.length > 0
      ? body.message
      : messageFor(code);

  return buildActionError({
    code,
    status: error.status,
    message,
    fieldErrors: toFieldErrors(body.fieldErrors),
    details: error.body,
  });
}

function toFieldErrors(value: unknown): FieldErrors | undefined {
  if (!value || typeof value !== "object") return undefined;

  const fieldErrors: FieldErrors = {};

  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      const texts = messages.filter(
        (item): item is string => typeof item === "string",
      );
      if (texts.length > 0) fieldErrors[field] = texts;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}
