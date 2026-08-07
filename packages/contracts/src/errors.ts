import { z } from 'zod';

/**
 * Catálogo de erros da API — fonte única do par (status HTTP, mensagem em pt-BR).
 *
 * Por que aqui e não no service do Nest: o texto precisa ser definido uma vez só, e nem o
 * backend nem o frontend sozinho consegue isso. Antes deste arquivo, a mensagem estava em
 * três lugares (throw na API, dicionário das actions, `toUserMessage` do cliente HTTP) e
 * eles já tinham divergido nas duas direções — 8 códigos do backend sem tradução no web e
 * 7 traduções no web sem ninguém que as lançasse.
 *
 * Como funciona:
 * - A API lança `new AppException('user-not-found')`; o `AllExceptionsFilter` resolve
 *   status e mensagem por aqui e serializa `{ ok: false, code, message, ... }`.
 * - O frontend **não** consulta este catálogo para obter texto — exibe o que veio na
 *   resposta. É isso que faz um web mais antigo que a API continuar mostrando a mensagem
 *   certa. Do catálogo ele importa só o tipo `ErrorCode`.
 *
 * Código novo: adicione a entrada aqui e o `AppException` passa a aceitá-lo. Sem a
 * entrada, o TypeScript recusa o `throw` — não existe mais slug solto.
 */
export const ERROR_CATALOG = {
  // --- Autenticação e permissão -----------------------------------------------------
  //
  // `invalid-credentials` é deliberadamente vago: distinguir "e-mail não cadastrado" de
  // "senha errada" entrega ao atacante quais e-mails existem na base.
  'invalid-credentials': { status: 401, message: 'E-mail ou senha inválidos.' },
  'token-not-found-or-expired': {
    status: 400,
    message: 'Este link expirou ou já foi utilizado. Solicite um novo.',
  },
  'passwords-not-matching': { status: 400, message: 'As senhas não conferem.' },

  // --- Usuários ---------------------------------------------------------------------
  'user-not-found': { status: 404, message: 'Usuário não encontrado.' },
  'invalid-user': { status: 400, message: 'Usuário inválido.' },
  'user-cpf-required': { status: 400, message: 'Informe o CPF do usuário.' },
  'email-already-taken': { status: 409, message: 'Este e-mail já está em uso.' },
  'cpf-already-taken': { status: 409, message: 'Este CPF já está cadastrado.' },

  // --- Catálogo ---------------------------------------------------------------------
  'course-not-found': { status: 404, message: 'Curso não encontrado.' },
  'invalid-course': { status: 400, message: 'Curso inválido.' },
  'course-category-not-found': { status: 404, message: 'Categoria de curso não encontrada.' },
  'category-not-valid': { status: 400, message: 'Categoria inválida.' },
  'institution-not-found': { status: 404, message: 'Instituição não encontrada.' },
  'invalid-institution': { status: 400, message: 'Instituição inválida.' },
  'missing-institution': { status: 400, message: 'Informe a instituição.' },
  'scholarship-not-found': { status: 404, message: 'Bolsa não encontrada.' },
  'invalid-scholarship': { status: 400, message: 'Bolsa inválida ou indisponível.' },
  'current-scholarship-not-found': {
    status: 400,
    message: 'A bolsa atual deste pedido não foi encontrada.',
  },

  // --- Pedidos e pagamentos ---------------------------------------------------------
  'order-not-found': { status: 404, message: 'Pedido não encontrado.' },
  'invalid-order': { status: 400, message: 'Pedido inválido.' },
  'order-already-exists': { status: 400, message: 'Já existe um pedido para esta bolsa.' },
  'missing-order-id': { status: 400, message: 'Informe o pedido.' },
  // 404 também quando o pagamento existe mas é de outro usuário: responder 403 confirmaria
  // a existência do registro alheio para quem só tem o id.
  'payment-not-found': { status: 404, message: 'Pagamento não encontrado.' },
  'external-client-not-found': {
    status: 400,
    message: 'Cliente não encontrado no gateway de pagamento.',
  },

  // Erros do Asaas. A mensagem daqui é o fallback: quando o gateway devolve uma
  // descrição própria (quase sempre em pt-BR e mais útil que qualquer texto genérico),
  // o `AppException` a usa no lugar — é o único caso em que a mensagem não sai deste
  // arquivo, porque o texto nasce fora do nosso domínio.
  'asaas-rejected': { status: 400, message: 'O gateway de pagamento recusou a operação.' },
  'asaas-unauthorized': { status: 401, message: 'Falha de autenticação no gateway de pagamento.' },
  'asaas-unavailable': {
    status: 503,
    message: 'O gateway de pagamento está indisponível. Tente novamente em instantes.',
  },
  'invalid-asaas-webhook-token': { status: 401, message: 'Token do webhook inválido.' },

  // --- Relacionamento ---------------------------------------------------------------
  'call-not-found': { status: 404, message: 'Ligação não encontrada.' },
  'invalid-receiver': { status: 400, message: 'Destinatário inválido.' },
  'indication-not-found': { status: 404, message: 'Indicação não encontrada.' },
  'notification-not-found': { status: 404, message: 'Notificação não encontrada.' },
  'possible-partner-not-found': { status: 404, message: 'Possível parceiro não encontrado.' },
  'faq-not-found': { status: 404, message: 'Pergunta não encontrada.' },
  'duplicated-data': { status: 400, message: 'Estes dados já foram cadastrados.' },

  // --- Parceiros e vendedores -------------------------------------------------------
  //
  // Estes dois respondem 400 (e não 404) porque é o status que a API já devolve hoje;
  // corrigir isso é mudança de comportamento e fica para uma decisão à parte.
  'partner-not-found': { status: 400, message: 'Parceiro não encontrado.' },
  'partner-code-already-taken': { status: 400, message: 'Este código de parceiro já está em uso.' },
  'seller-not-found': { status: 400, message: 'Vendedor não encontrado.' },
  'seller-email-already-taken': { status: 400, message: 'Este e-mail de vendedor já está em uso.' },

  // --- Uploads e integrações --------------------------------------------------------
  'unsupported-file-type': { status: 422, message: 'Tipo de arquivo não suportado.' },
  'storage-not-configured': {
    status: 503,
    message: 'O armazenamento de arquivos não está configurado.',
  },
  'asaas-api-key-not-configured': {
    status: 503,
    message: 'A integração de pagamento não está configurada.',
  },
  'asaas-webhook-token-not-configured': {
    status: 503,
    message: 'O webhook do gateway não está configurado.',
  },
  'contact-not-configured': {
    status: 503,
    message: 'O canal de contato não está configurado. Tente novamente mais tarde.',
  },
  'contact-not-delivered': {
    status: 503,
    message: 'Não foi possível enviar sua mensagem. Tente novamente em instantes.',
  },

  // --- Genéricos --------------------------------------------------------------------
  //
  // Usados pelo filtro quando a exceção não é nossa (throttler, Multer, um HttpException
  // de biblioteca) e só o status é conhecido. Não lance estes diretamente quando existir
  // um código específico — é o código específico que a UI consegue tratar.
  'validation-error': { status: 400, message: 'Confira os campos destacados.' },
  'bad-request': { status: 400, message: 'Requisição inválida. Revise os dados enviados.' },
  unauthorized: { status: 401, message: 'Sua sessão expirou. Faça login novamente.' },
  forbidden: { status: 403, message: 'Você não tem permissão para esta ação.' },
  'not-found': { status: 404, message: 'Registro não encontrado.' },
  conflict: { status: 409, message: 'Este registro já existe.' },
  'payload-too-large': { status: 413, message: 'O arquivo enviado é grande demais.' },
  'unsupported-media-type': { status: 415, message: 'Formato de conteúdo não suportado.' },
  'too-many-requests': {
    status: 429,
    message: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
  },
  'internal-error': {
    status: 500,
    message: 'Tivemos um problema no servidor. Tente novamente em instantes.',
  },
  'service-unavailable': {
    status: 503,
    message: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
  },
} as const satisfies Record<string, { status: number; message: string }>;

/**
 * Todos os códigos que a API pode devolver. É uma união de literais, então comparar
 * `error.code === '...'` com um código inexistente vira erro de compilação.
 */
export type ErrorCode = keyof typeof ERROR_CATALOG;

export const ERROR_CODES = Object.keys(ERROR_CATALOG) as ErrorCode[];

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && value in ERROR_CATALOG;
}

/** Status HTTP e mensagem padrão de um código. */
export function errorInfo(code: ErrorCode): { status: number; message: string } {
  return ERROR_CATALOG[code];
}

/**
 * Código genérico para um status sem código específico — o caminho de exceções que não
 * são nossas. Cai em `internal-error` para qualquer status não mapeado.
 */
const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: 'bad-request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  413: 'payload-too-large',
  415: 'unsupported-media-type',
  422: 'validation-error',
  429: 'too-many-requests',
  500: 'internal-error',
  503: 'service-unavailable',
};

export function errorCodeForStatus(status: number): ErrorCode {
  return CODE_BY_STATUS[status] ?? 'internal-error';
}

/** Erros por campo, na forma que o formulário usa para marcar os inputs. */
export const FieldErrorsSchema = z.record(z.string(), z.array(z.string()));

export type FieldErrors = z.infer<typeof FieldErrorsSchema>;

/**
 * Corpo de QUALQUER resposta de erro da API. O `ok: false` espelha o `{ ok: true, ... }`
 * das respostas de sucesso, então o cliente pode discriminar pelo mesmo campo.
 */
export const ApiErrorResponseSchema = z
  .object({
    ok: z.literal(false),
    code: z.string(),
    message: z.string(),
    statusCode: z.number().int(),
    timestamp: z.string(),
    path: z.string(),
    fieldErrors: FieldErrorsSchema.optional(),
  })
  .meta({
    id: 'ApiError',
    description: 'Resposta de erro padrão. `code` é estável e serve para lógica; `message` é pt-BR pronto para exibir.',
  });

export type ApiErrorResponse = Omit<z.infer<typeof ApiErrorResponseSchema>, 'code'> & {
  code: ErrorCode;
};
