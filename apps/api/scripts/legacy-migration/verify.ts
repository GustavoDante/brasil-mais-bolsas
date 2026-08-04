/**
 * Conferência pós-migração — lê os dados migrados pela mesma camada que a API usa (Prisma),
 * navegando pelas relações para provar que as foreign keys ficaram consistentes.
 *
 * Uso: npx ts-node scripts/legacy-migration/verify.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaClient } from '@repo/db';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main(): Promise<void> {
  const [users, minors, orders, payments, scholarships] = await Promise.all([
    prisma.user.count(),
    prisma.minor.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.scholarship.count(),
  ]);
  console.log(
    `Totais: ${users} usuários | ${minors} dependentes | ${scholarships} bolsas | ${orders} pedidos | ${payments} pagamentos`,
  );

  const sample = await prisma.user.findFirst({
    where: { minors: { some: {} }, orders: { some: {} }, address: { isNot: null } },
    include: {
      address: true,
      minors: true,
      orders: {
        include: {
          scholarship: {
            include: { course: { include: { category: true } }, institution: true },
          },
          payments: true,
        },
      },
    },
  });

  if (!sample) {
    console.log('Nenhum usuário com endereço + dependente + pedido encontrado.');
    return;
  }

  console.log('\nAmostra completa (usuário -> endereço, dependentes, pedidos, bolsa, pagamentos):');
  console.log(
    JSON.stringify(
      {
        usuario: {
          nome: sample.name,
          email: sample.email,
          tipo: sample.type,
          nascimento: sample.birthdate,
          renda_familiar: sample.family_income,
        },
        endereco: sample.address
          ? `${sample.address.street}, ${sample.address.number} - ${sample.address.city}/${sample.address.state}`
          : null,
        dependentes: sample.minors.map((minor) => ({
          nome: minor.name,
          nascimento: minor.birthdate,
        })),
        pedidos: sample.orders.map((order) => ({
          code: order.code,
          bolsa: {
            curso: order.scholarship.course.name,
            categoria: order.scholarship.course.category.name,
            tipo: order.scholarship.type,
            instituicao: order.scholarship.institution.name,
            valor_final: order.scholarship.final_price,
          },
          pagamentos: order.payments.map((payment) => ({
            status: payment.status,
            tipo: payment.payment_type,
            valor: payment.final_price,
          })),
        })),
      },
      null,
      2,
    ),
  );

  const porStatus = await prisma.payment.groupBy({ by: ['status'], _count: true });
  console.log(
    '\nPagamentos por status:',
    JSON.stringify(
      porStatus
        .map((row) => ({ status: row.status, qtd: row._count }))
        .sort((a, b) => b.qtd - a.qtd),
    ),
  );

  const dependentesPorUsuario = await prisma.minor.groupBy({ by: ['user_id'], _count: true });
  const maximo = dependentesPorUsuario.reduce((max, row) => Math.max(max, row._count), 0);
  console.log(
    `\nDependentes: ${dependentesPorUsuario.length} usuários, máximo de ${maximo} por usuário ` +
      '(a tabela nova aceita N; o legado só permitia 1).',
  );
}

main()
  .catch((error: unknown) => {
    console.error('Falha na conferência:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
