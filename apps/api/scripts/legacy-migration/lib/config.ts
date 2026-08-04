import 'dotenv/config';
import * as path from 'node:path';

export type ConflictStrategy = 'skip' | 'update';

export interface MigrationConfig {
  /** Connection string of the legacy (Sequelize) PostgreSQL database. */
  legacyUrl: string;
  /** Connection string of the new (Prisma) PostgreSQL database. */
  targetUrl: string;
  /** Whether the legacy connection needs SSL (AWS RDS / Lightsail usually does). */
  legacySsl: boolean;
  /** Read everything, transform everything, but never write to the target database. */
  dryRun: boolean;
  /** Wipe every table of the target database before importing. Requires --confirm. */
  reset: boolean;
  confirm: boolean;
  /** Run only these steps (empty = all). */
  only: string[];
  /** Skip these steps. */
  skip: string[];
  /** How many rows are sent to the target database per statement. */
  batchSize: number;
  /** Stop after N rows per step (useful to smoke-test the mapping). */
  limit: number | null;
  /** `skip` = INSERT ... ON CONFLICT DO NOTHING, `update` = upsert row by row. */
  onConflict: ConflictStrategy;
  /** Where the JSON report is written. */
  reportPath: string;
}

export const HELP = `
Migração de dados: API legada (Sequelize) -> API nova (Prisma)

Uso:
  npm run db:migrate:legacy -- [opções]
  npx ts-node scripts/legacy-migration/migrate.ts [opções]

Variáveis de ambiente:
  LEGACY_DATABASE_URL   (obrigatória) conexão do banco antigo
  DATABASE_URL          (obrigatória) conexão do banco novo
  LEGACY_DATABASE_SSL   "true" para exigir SSL no banco antigo (padrão: true se o host não for local)

Opções:
  --dry-run             lê e transforma tudo, mas não grava nada
  --only=a,b            executa apenas os passos informados
  --skip=a,b            pula os passos informados
  --batch-size=500      linhas por statement (padrão: 500)
  --limit=100           processa no máximo N linhas por passo (teste)
  --on-conflict=skip    skip (padrão) ignora registros já existentes | update faz upsert
  --reset --confirm     apaga TODOS os dados do banco novo antes de importar
  --report=caminho.json onde salvar o relatório (padrão: scripts/legacy-migration/reports/)
  --list                lista os passos disponíveis e sai
  --help                mostra esta ajuda
`;

function flag(argv: string[], name: string): boolean {
  return argv.includes(`--${name}`);
}

function value(argv: string[], name: string): string | null {
  const prefix = `--${name}=`;
  const found = argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function list(argv: string[], name: string): string[] {
  const raw = value(argv, name);
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function positiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isLocalHost(url: string): boolean {
  return /@(localhost|127\.0\.0\.1|host\.docker\.internal|db|postgres)[:/]/.test(url);
}

export function parseConfig(argv: string[]): MigrationConfig {
  const legacyUrl = process.env['LEGACY_DATABASE_URL'] ?? '';
  const targetUrl = process.env['DATABASE_URL'] ?? '';

  const sslEnv = process.env['LEGACY_DATABASE_SSL'];
  const legacySsl =
    sslEnv === undefined ? legacyUrl.length > 0 && !isLocalHost(legacyUrl) : sslEnv === 'true';

  const onConflictRaw = value(argv, 'on-conflict');
  const onConflict: ConflictStrategy = onConflictRaw === 'update' ? 'update' : 'skip';

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath =
    value(argv, 'report') ??
    path.join(process.cwd(), 'scripts', 'legacy-migration', 'reports', `migration-${stamp}.json`);

  return {
    legacyUrl,
    targetUrl,
    legacySsl,
    dryRun: flag(argv, 'dry-run'),
    reset: flag(argv, 'reset'),
    confirm: flag(argv, 'confirm'),
    only: list(argv, 'only'),
    skip: list(argv, 'skip'),
    batchSize: positiveInt(value(argv, 'batch-size'), 500),
    limit: value(argv, 'limit') ? positiveInt(value(argv, 'limit'), 0) : null,
    onConflict,
    reportPath,
  };
}

export function validateConfig(config: MigrationConfig): string[] {
  const errors: string[] = [];
  if (!config.legacyUrl) errors.push('LEGACY_DATABASE_URL não definida.');
  if (!config.targetUrl) errors.push('DATABASE_URL não definida.');
  if (config.reset && !config.confirm) {
    errors.push('--reset exige --confirm (a operação apaga todos os dados do banco novo).');
  }
  if (config.reset && process.env['NODE_ENV'] === 'production') {
    errors.push('--reset é bloqueado quando NODE_ENV=production.');
  }
  return errors;
}
