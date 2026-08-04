import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

/** Erro por campo, no formato que o frontend usa para marcar os inputs do formulário. */
type FieldErrors = Record<string, string[]>;

interface ZodIssue {
  path?: unknown[];
  message?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Erro interno do servidor';

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Falha de validação vira `fieldErrors` além da mensagem: sem isso o formulário do web
    // só consegue mostrar um erro geral, sem apontar qual campo recusou.
    const fieldErrors =
      exception instanceof ZodValidationException
        ? toFieldErrors(exception.getZodError())
        : undefined;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    });
  }
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
