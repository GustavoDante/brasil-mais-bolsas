import 'dotenv/config';
import { PrismaClient, createPrismaConnection } from '@repo/db';
import { HELP, parseConfig, validateConfig } from './lib/config';
import type { MigrationContext } from './lib/context';
import { IdRegistry, type IdLoader } from './lib/ids';
import { LegacySource } from './lib/legacy-db';
import { MigrationReport } from './lib/report';
import { runSteps } from './lib/runner';
import { steps } from './steps';

/** Order used by --reset: children first, parents last. */
const RESET_ORDER = [
  'userIdentity',
  'address',
  'minor',
  'externalClient',
  'notification',
  'call',
  'indicationCall',
  'indication',
  'possiblePartnerCall',
  'possiblePartner',
  'signedContract',
  'payment',
  'order',
  'access',
  'faq',
  'user',
  'scholarship',
  'course',
  'courseCategory',
  'institution',
  'partner',
  'seller',
] as const;

function buildIdLoaders(prisma: PrismaClient): Record<string, IdLoader> {
  const none: IdLoader = async () => [];

  return {
    // Models referenced as foreign keys by other steps.
    seller: () => prisma.seller.findMany({ select: { id: true } }),
    partner: () => prisma.partner.findMany({ select: { id: true } }),
    institution: () => prisma.institution.findMany({ select: { id: true } }),
    courseCategory: () => prisma.courseCategory.findMany({ select: { id: true } }),
    course: () => prisma.course.findMany({ select: { id: true } }),
    scholarship: () => prisma.scholarship.findMany({ select: { id: true } }),
    user: () => prisma.user.findMany({ select: { id: true } }),
    order: () => prisma.order.findMany({ select: { id: true } }),
    indication: () => prisma.indication.findMany({ select: { id: true } }),
    possiblePartner: () => prisma.possiblePartner.findMany({ select: { id: true } }),
    // Leaf models: never used as a parent, so their ids do not need to be preloaded.
    access: none,
    address: none,
    minor: none,
    externalClient: none,
    payment: none,
    signedContract: none,
    indicationCall: none,
    possiblePartnerCall: none,
    call: none,
    notification: none,
    faq: none,
  };
}

async function resetTarget(prisma: PrismaClient): Promise<void> {
  console.log('⚠️  --reset: apagando todos os dados do banco novo...');
  for (const model of RESET_ORDER) {
    const deleted = await prisma.$executeRawUnsafe(
      `DELETE FROM "${model.replace(/^./, (c) => c.toUpperCase())}"`,
    );
    console.log(`   ${model}: ${deleted} linha(s) removida(s)`);
  }
}

async function assertTargetSchema(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.user.count();
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : String(error);
    throw new Error(
      `Não foi possível ler o banco novo (${detail}). ` +
        'Rode "npx prisma migrate deploy" antes de importar os dados.',
    );
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    return 0;
  }

  if (argv.includes('--list')) {
    console.log('\nPassos disponíveis (na ordem de execução):\n');
    for (const step of steps) console.log(`  ${step.name.padEnd(24)} ${step.description}`);
    console.log('');
    return 0;
  }

  const config = parseConfig(argv);
  const errors = validateConfig(config);
  if (errors.length > 0) {
    console.error('\nConfiguração inválida:');
    for (const error of errors) console.error(`  - ${error}`);
    console.error(HELP);
    return 1;
  }

  const legacy = new LegacySource(config.legacyUrl, config.legacySsl);
  const { adapter, pool } = createPrismaConnection(config.targetUrl);
  const prisma = new PrismaClient({ adapter });
  const report = new MigrationReport();

  const ctx: MigrationContext = {
    config,
    legacy,
    prisma,
    report,
    ids: new IdRegistry(buildIdLoaders(prisma)),
  };

  console.log('\n=== Migração de dados: API legada (Sequelize) -> API nova (Prisma) ===');
  console.log(`modo:        ${config.dryRun ? 'DRY-RUN (nada será gravado)' : 'GRAVAÇÃO'}`);
  console.log(
    `conflitos:   ${config.onConflict === 'update' ? 'upsert (atualiza)' : 'ignora existentes'}`,
  );
  console.log(
    `lote:        ${config.batchSize}${config.limit ? ` | limite por passo: ${config.limit}` : ''}`,
  );

  try {
    await assertTargetSchema(prisma);

    if (config.reset && !config.dryRun) await resetTarget(prisma);

    const selected = steps.filter((step) => {
      if (config.only.length > 0 && !config.only.includes(step.name)) return false;
      if (config.skip.includes(step.name)) return false;
      return true;
    });

    if (selected.length === 0) {
      console.error('Nenhum passo selecionado. Use --list para ver os passos disponíveis.');
      return 1;
    }

    console.log('');
    await runSteps(ctx, selected, (message) => console.log(message));

    report.printSummary(config.dryRun);
    report.save(config.reportPath, {
      dryRun: config.dryRun,
      onConflict: config.onConflict,
      only: config.only,
      skip: config.skip,
      limit: config.limit,
      reset: config.reset,
    });
    console.log(`\nRelatório salvo em: ${config.reportPath}\n`);

    return report.hasErrors() ? 1 : 0;
  } finally {
    await prisma.$disconnect();
    await pool.end();
    await legacy.close();
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error('\nFalha na migração:', error);
    process.exitCode = 1;
  });
