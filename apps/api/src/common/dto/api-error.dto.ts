import { ApiErrorResponseSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

/**
 * O corpo de erro, para o Swagger.
 *
 * Não é usado em nenhum handler — quem monta a resposta é o `AllExceptionsFilter`. Existe
 * para que `/docs` publique a forma do erro como componente nomeado (`ApiError`), já que
 * ela é a mesma para todas as rotas e o cliente precisa conhecê-la.
 */
export class ApiErrorDto extends createZodDto(ApiErrorResponseSchema) {}
