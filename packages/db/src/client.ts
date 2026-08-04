import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma';

/**
 * O Prisma 7 não tem mais engine embutida: todo client precisa de um driver adapter.
 * Este módulo centraliza a montagem do par Pool + adapter que antes vivia dentro do
 * `PrismaService` da API, para que scripts, seed e a aplicação usem a mesma configuração.
 */

/**
 * O `pg` é detalhe de implementação deste pacote: quem consome só precisa saber que
 * recebe algo com `end()` para fechar no shutdown. Reexportar o tipo evita que cada app
 * tenha de declarar `pg` como dependência só para tipar o Pool.
 */
export type PrismaPool = Pool;

export interface PrismaConnection {
  adapter: PrismaPg;
  pool: Pool;
}

/**
 * Monta o adapter e o Pool. Quem chama é dono do Pool e precisa fechá-lo no shutdown —
 * conexão vazada aqui esgota o limite do Postgres sem nenhum erro visível.
 */
export function createPrismaConnection(
  connectionString: string | undefined = process.env['DATABASE_URL'],
): PrismaConnection {
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const pool = new Pool({ connectionString });

  return { adapter: new PrismaPg(pool), pool };
}

interface PrismaGlobal {
  __bmbPrisma?: PrismaClient;
}

const globalForPrisma = globalThis as unknown as PrismaGlobal;

/**
 * Client compartilhado para scripts, seed e migrações.
 *
 * É **preguiçoso** de propósito: a maior parte do monorepo importa `@repo/db` só para
 * tipos e enums, e instanciar no topo do módulo faria qualquer um desses imports
 * explodir quando `DATABASE_URL` não estivesse definida (build, testes, bundle do Next).
 *
 * A aplicação NestJS **não** usa esta função — lá o client é o `PrismaService`, com o
 * ciclo de vida amarrado ao do módulo.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__bmbPrisma) {
    const { adapter } = createPrismaConnection();
    globalForPrisma.__bmbPrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.__bmbPrisma;
}
