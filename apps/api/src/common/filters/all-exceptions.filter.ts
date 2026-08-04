import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import {
  ERROR_CATALOG,
  errorCodeForStatus,
  type ErrorCode,
  type FieldErrors,
} from '@repo/contracts';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

import { AppException } from '../exceptions/app.exception';

interface ZodIssue {
  path?: unknown[];
  message?: string;
}

/** O que o filtro precisa saber para montar a resposta. */
interface ResolvedError {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
}

/**
 * Único ponto onde uma exceção vira resposta HTTP.
 *
 * O corpo é sempre o mesmo — `{ ok: false, code, message, ... }` — e tanto o `code` quanto
 * a `message` saem do `ERROR_CATALOG` de `@repo/contracts`. O frontend exibe a `message`
 * como veio e decide comportamento pelo `code`; ele não traduz nada.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { code, message, fieldErrors } = resolve(exception);
    const status = ERROR_CATALOG[code].status;

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status} (${code})`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      ok: false,
      code,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(fieldErrors ? { fieldErrors } : {}),
    });
  }
}

function resolve(exception: unknown): ResolvedError {
  // 1. Erro nosso: o código já veio escolhido e o catálogo dá o resto.
  if (exception instanceof AppException) {
    return {
      code: exception.code,
      message: messageOf(exception, ERROR_CATALOG[exception.code].message),
      fieldErrors: exception.fieldErrors,
    };
  }

  // 2. Validação: o corpo não bate com o schema Zod. Os `fieldErrors` são o que permite ao
  //    formulário marcar o input errado em vez de mostrar só um aviso geral.
  if (exception instanceof ZodValidationException) {
    return {
      code: 'validation-error',
      message: ERROR_CATALOG['validation-error'].message,
      fieldErrors: toFieldErrors(exception.getZodError()),
    };
  }

  // 3. `HttpException` que não é nossa (throttler, Multer, guards do Nest): só o status é
  //    confiável. O texto dela é técnico e em inglês — fica no log, não na tela.
  if (exception instanceof HttpException) {
    const code = errorCodeForStatus(exception.getStatus());
    return { code, message: ERROR_CATALOG[code].message };
  }

  // 4. Qualquer outra coisa é bug ou falha de infraestrutura. A mensagem original pode
  //    conter query, stack ou credencial de conexão — nunca sai daqui.
  return { code: 'internal-error', message: ERROR_CATALOG['internal-error'].message };
}

/** A mensagem que o `AppException` embalou (pode ser o override do gateway externo). */
function messageOf(exception: AppException, fallback: string): string {
  const body = exception.getResponse();

  if (body && typeof body === 'object') {
    const { message } = body as { message?: unknown };
    if (typeof message === 'string' && message.length > 0) return message;
  }

  return fallback;
}

function toFieldErrors(error: unknown): FieldErrors | undefined {
  const issues = (error as { issues?: unknown } | null | undefined)?.issues;
  if (!Array.isArray(issues)) return undefined;

  const fieldErrors: FieldErrors = {};

  for (const issue of issues as ZodIssue[]) {
    // Caminho vazio = erro do objeto inteiro (ex.: o `.refine` de senhas que não conferem).
    const key = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join('.') : '_';
    const text = issue.message ?? 'Valor inválido';

    (fieldErrors[key] ??= []).push(text);
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}
