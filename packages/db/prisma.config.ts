import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// `prisma generate`/`migrate` rodam a partir de packages/db, mas a URL do banco é a mesma
// para todo o repositório. A cadeia abaixo evita duplicar o segredo em dois arquivos: o
// dotenv não sobrescreve variável já definida, então o primeiro que tiver a chave vence.
loadEnv();
loadEnv({ path: '../../.env' });
loadEnv({ path: '../../apps/api/.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
