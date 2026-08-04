import { ApiError, isApiError } from "@/lib/api/errors";

/**
 * Erro padronizado devolvido por qualquer action.
 *
 * `code` é o identificador estável (o slug que o backend usa, ex.: `user-not-found`) —
 * é nele que a UI deve decidir comportamento, nunca no texto.
 * `message` é o texto pronto para exibir, em pt-BR.
 */
export interface ActionError {
  code: string;
  message: string;
  /** Status HTTP; `0` quando a requisição não chegou a ter resposta (rede/timeout). */
  status: number;
  /** Erros por campo, quando a validação (local ou do backend) falha. */
  fieldErrors?: Record<string, string[]>;
  /** Corpo original do erro — só para log/depuração, não exibir. */
  details?: unknown;
}

/** Códigos gerados no próprio frontend (não vêm do backend). */
export const ACTION_ERROR_CODES = {
  validation: "validation-error",
  unauthenticated: "not-authenticated",
  network: "network-error",
  timeout: "timeout-error",
  unknown: "unknown-error",
} as const;

export const DEFAULT_ERROR_MESSAGE =
  "Não foi possível concluir a operação. Tente novamente em instantes.";

/**
 * Mensagens em pt-BR para os códigos conhecidos do backend.
 *
 * Ao adicionar um `throw new XException('novo-codigo')` na API, adicione a mensagem aqui.
 * Códigos ausentes continuam funcionando: caem no fallback por status HTTP e, em último
 * caso, na mensagem padrão — nunca vaza slug técnico para o usuário.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // autenticação e permissão
  unauthorized: "Você não tem permissão para esta ação.",
  forbidden: "Você não tem permissão para esta ação.",
  "invalid-credentials": "E-mail ou senha inválidos.",
  "token-expired": "Sua sessão expirou. Faça login novamente.",

  // usuários
  "user-not-found": "Usuário não encontrado.",
  "invalid-user": "Usuário inválido.",
  "user-cpf-required": "Informe o CPF do usuário.",
  "email-already-taken": "Este e-mail já está em uso.",

  // catálogo
  "course-not-found": "Curso não encontrado.",
  "invalid-course": "Curso inválido.",
  "course-category-not-found": "Categoria de curso não encontrada.",
  "category-not-valid": "Categoria inválida.",
  "institution-not-found": "Instituição não encontrada.",
  "missing-institution": "Informe a instituição.",
  "invalid-institution": "Instituição inválida.",
  "scholarship-not-found": "Bolsa não encontrada.",
  "invalid-scholarship": "Bolsa inválida.",
  "current-scholarship-not-found": "Bolsa atual não encontrada.",

  // pedidos e pagamentos
  "order-not-found": "Pedido não encontrado.",
  "order-already-exists": "Já existe um pedido para esta bolsa.",
  "interest-payment-already-exists":
    "Já existe uma cobrança de juros para este pedido.",
  "payment-not-found": "Pagamento não encontrado.",
  "asaas-error": "O gateway de pagamento recusou a operação.",
  "invalid-asaas-webhook-token": "Token do webhook inválido.",
  "asaas-webhook-token-not-configured": "Webhook do gateway não configurado.",

  // relacionamento
  "call-not-found": "Ligação não encontrada.",
  "invalid-receiver": "Destinatário inválido.",
  "indication-not-found": "Indicação não encontrada.",
  "possible-partner-not-found": "Possível parceiro não encontrado.",
  "notification-not-found": "Notificação não encontrada.",
  "partner-not-found": "Parceiro não encontrado.",
  "seller-not-found": "Vendedor não encontrado.",
  "faq-not-found": "Pergunta não encontrada.",
  "external-client-not-found": "Cliente não encontrado no gateway.",
  "duplicated-data": "Estes dados já foram cadastrados.",

  // gerados no frontend
  [ACTION_ERROR_CODES.validation]: "Confira os campos destacados.",
  [ACTION_ERROR_CODES.unauthenticated]: "Faça login para continuar.",
  [ACTION_ERROR_CODES.network]: "Não foi possível conectar ao servidor.",
  [ACTION_ERROR_CODES.timeout]:
    "A operação demorou mais que o esperado. Tente novamente.",
  [ACTION_ERROR_CODES.unknown]: DEFAULT_ERROR_MESSAGE,
};

/** Código padrão quando o backend não manda um slug reconhecível. */
const CODE_BY_STATUS: Record<number, string> = {
  400: "invalid-request",
  401: "unauthorized",
  403: "forbidden",
  404: "not-found",
  409: "conflict",
  422: "validation-error",
  429: "too-many-requests",
  500: "server-error",
  502: "server-error",
  503: "service-unavailable",
  504: "timeout-error",
};

const MESSAGE_BY_STATUS: Record<number, string> = {
  400: "Requisição inválida. Revise os dados enviados.",
  401: "Sua sessão expirou. Faça login novamente.",
  403: "Você não tem permissão para esta ação.",
  404: "Registro não encontrado.",
  409: "Este registro já existe.",
  422: "Confira os campos destacados.",
  429: "Muitas tentativas. Aguarde um minuto e tente novamente.",
  500: "Tivemos um problema no servidor. Tente novamente em instantes.",
  502: "Tivemos um problema no servidor. Tente novamente em instantes.",
  503: "Serviço temporariamente indisponível. Tente novamente em instantes.",
  504: "A operação demorou mais que o esperado. Tente novamente.",
};

/** Um slug do backend: kebab-case, sem espaços (ex.: `user-not-found`). */
function isErrorCode(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length <= 60;
}

interface ExtractedPayload {
  /** Slug estável do backend (`user-not-found`). */
  code?: string;
  /** Texto que o backend marcou explicitamente como exibível (`userMessage`). */
  userMessage?: string;
  /** Mensagens do class-validator. */
  messages?: string[];
}

/**
 * O `AllExceptionsFilter` responde `{ statusCode, timestamp, path, message }`, onde
 * `message` é o `getResponse()` da exceção — ou seja, pode ser:
 * - string simples (`"Erro interno do servidor"`);
 * - objeto do Nest (`{ statusCode, message: 'user-not-found', error: 'Not Found' }`);
 * - objeto de domínio (`{ message: 'invalid-institution', userMessage: 'Instituição inválida' }`);
 * - array do class-validator (`['email must be an email']`).
 */
function extractPayload(body: unknown, depth = 0): ExtractedPayload {
  if (depth > 4 || body === null || body === undefined) return {};

  // Texto sem cara de slug é técnico ("Erro interno do servidor", "ThrottlerException: …")
  // e não vai para a tela: a mensagem exibida vem do dicionário/status.
  if (typeof body === "string") {
    return isErrorCode(body) ? { code: body } : {};
  }

  if (Array.isArray(body)) {
    const messages = body.filter(
      (item): item is string => typeof item === "string",
    );
    return messages.length > 0 ? { messages } : {};
  }

  if (typeof body !== "object") return {};

  const record = body as Record<string, unknown>;
  const nested = extractPayload(record.message, depth + 1);

  // Mensagem amigável enviada de propósito pelo backend tem prioridade.
  const userMessage =
    typeof record.userMessage === "string" && record.userMessage.length > 0
      ? record.userMessage
      : nested.userMessage;

  return {
    code: nested.code,
    userMessage,
    messages: nested.messages,
  };
}

/** Agrupa as mensagens do class-validator por campo (o campo é a 1ª palavra). */
function toFieldErrors(messages: string[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const message of messages) {
    const [field] = message.split(" ");
    const key = field && /^[a-zA-Z0-9_.]+$/.test(field) ? field : "_";
    (fieldErrors[key] ??= []).push(message);
  }

  return fieldErrors;
}

export function buildActionError(params: {
  code: string;
  status?: number;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  details?: unknown;
}): ActionError {
  const { code, status = 0, message, fieldErrors, details } = params;

  return {
    code,
    message: message ?? ERROR_MESSAGES[code] ?? DEFAULT_ERROR_MESSAGE,
    status,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(details !== undefined ? { details } : {}),
  };
}

/**
 * Converte qualquer erro (HTTP, rede, timeout, exceção inesperada) no formato padrão.
 * O código sempre vem do backend quando ele manda um; nunca inventamos slug.
 */
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

function fromApiError(error: ApiError): ActionError {
  if (error.kind === "timeout") {
    return buildActionError({ code: ACTION_ERROR_CODES.timeout, status: 0 });
  }

  if (error.kind === "network") {
    return buildActionError({ code: ACTION_ERROR_CODES.network, status: 0 });
  }

  const payload = extractPayload(error.body);
  const status = error.status;

  if (payload.messages && payload.messages.length > 0) {
    return buildActionError({
      code: ACTION_ERROR_CODES.validation,
      status,
      message: ERROR_MESSAGES[ACTION_ERROR_CODES.validation],
      fieldErrors: toFieldErrors(payload.messages),
      details: payload.messages,
    });
  }

  const code =
    payload.code ?? CODE_BY_STATUS[status] ?? ACTION_ERROR_CODES.unknown;

  // Ordem: mensagem explícita do backend → dicionário do código → padrão do status → padrão.
  const message =
    payload.userMessage ??
    ERROR_MESSAGES[code] ??
    MESSAGE_BY_STATUS[status] ??
    DEFAULT_ERROR_MESSAGE;

  return buildActionError({ code, status, message, details: error.body });
}
