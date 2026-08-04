import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createPrismaConnection, PrismaClient, type PrismaPool } from '@repo/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: PrismaPool;

  constructor() {
    // A montagem do Pool + driver adapter mora em `@repo/db`, para que aplicação, seed e
    // scripts de migração conectem exatamente da mesma forma.
    const { adapter, pool } = createPrismaConnection();

    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    // Fecha o pool: sem isso a conexão fica pendurada e esgota o limite do Postgres.
    await this.pool?.end();
  }
}
