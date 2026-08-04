/**
 * `@repo/db` — camada de persistência do monorepo.
 *
 * Server-only: reexporta o client Prisma inteiro (classe, namespace `Prisma`, tipos de
 * model e enums). **Nunca** importe este pacote do lado do cliente — quem precisa do
 * contrato da API no browser usa `@repo/contracts`.
 */

export * from '../generated/prisma';
export * from './client';
