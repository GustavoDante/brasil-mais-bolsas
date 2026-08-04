import { HttpException } from '@nestjs/common';
import { ERROR_CATALOG, type ErrorCode, type FieldErrors } from '@repo/contracts';

interface AppExceptionOptions {
  /** Erros por campo, quando a recusa é de validação e aponta para inputs específicos. */
  fieldErrors?: FieldErrors;
  /**
   * Substitui a mensagem do catálogo. Existe para UM caso: erro de terceiro cujo texto
   * nasce fora do nosso domínio (a descrição que o Asaas devolve). Não use para variar o
   * texto de um erro nosso — nesse caso o que falta é um código novo no catálogo.
   */
  message?: string;
  /** Contexto técnico para o log. Nunca chega ao cliente. */
  cause?: unknown;
}

/**
 * A exceção da aplicação. Status e mensagem saem do `ERROR_CATALOG` de `@repo/contracts`,
 * então não há como um `throw` inventar um status ou um texto: o código é a única coisa
 * que o chamador escolhe, e ele é tipado.
 *
 * ```ts
 * throw new AppException('user-not-found');
 * ```
 */
export class AppException extends HttpException {
  readonly code: ErrorCode;
  /**
   * Mesmo valor de `getStatus()`, como campo público. O `status` do `HttpException` é
   * privado, e os testes precisam afirmar o status sem chamar método na rejeição.
   */
  readonly httpStatus: number;
  readonly fieldErrors?: FieldErrors;

  constructor(code: ErrorCode, options: AppExceptionOptions = {}) {
    const { status, message } = ERROR_CATALOG[code];

    super(
      { code, message: options.message ?? message },
      status,
      options.cause === undefined ? undefined : { cause: options.cause },
    );

    this.code = code;
    this.httpStatus = status;
    this.fieldErrors = options.fieldErrors;
  }
}
