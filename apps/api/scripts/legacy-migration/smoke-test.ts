/**
 * Smoke test da migração — roda o pipeline completo em memória, sem banco de dados.
 *
 * Um "banco legado" falso (com os casos ruins que existem no banco real: e-mail duplicado,
 * FK órfã, campo obrigatório nulo, enum fora do padrão, código de pedido repetido) é
 * processado pelos mesmos passos usados em produção, gravando em um "Prisma" falso que
 * valida as constraints UNIQUE do schema novo.
 *
 * Uso: npm run db:migrate:legacy:smoke
 */
import type { PrismaClient } from '@repo/db';
import type { MigrationConfig } from './lib/config';
import type { MigrationContext } from './lib/context';
import { IdRegistry, legacyId } from './lib/ids';
import type { LegacyRow, LegacySource } from './lib/legacy-db';
import { MigrationReport } from './lib/report';
import { runSteps } from './lib/runner';
import { steps } from './steps';

const NOW = new Date('2024-05-10T12:00:00.000Z');
const EARLIER = new Date('2023-01-01T08:00:00.000Z');

/** Every row of a table must declare the same keys (the fake introspection uses the first row). */
function table(rows: LegacyRow[]): LegacyRow[] {
  const keys = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) keys.add(key);
  return rows.map((row) => {
    const complete: LegacyRow = {};
    for (const key of keys) complete[key] = row[key] ?? null;
    return complete;
  });
}

const fixtures: Record<string, LegacyRow[]> = {
  sellers: table([
    {
      id: 1,
      name: 'Vendedor 1',
      email: 'v1@bmb.com',
      password: 'hash',
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 2,
      name: null,
      email: 'v2@bmb.com',
      password: null,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
  ]),
  partners: table([
    {
      id: 1,
      name: 'Parceiro 1',
      code: 'ABC',
      password: '123123',
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 2,
      name: 'Parceiro 2',
      code: 'ABC',
      password: '123123',
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
  ]),
  accesses: table([
    { id: 1, partner_id: '1', created_at: EARLIER, updated_at: EARLIER },
    { id: 2, partner_id: '999', created_at: EARLIER, updated_at: EARLIER },
  ]),
  institutions: table([
    {
      id: 1,
      name: 'Faculdade A',
      description: 'desc',
      image: 'a.png',
      cnpj: '00.000.000/0001-00',
      email: '',
      phone: '(11)3333-3333',
      owner_name: 'Dono',
      operator_name: 'Op',
      street: 'Rua',
      number: '1',
      district: 'Centro',
      city: 'SP',
      state: 'SP',
      postal_code: '01000-000',
      students_count: 10,
      seller_id: 1,
      fake: false,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 2,
      name: 'Faculdade B',
      description: 'desc',
      image: 'b.png',
      cnpj: '00.000.000/0002-00',
      phone: '(11)3333-4444',
      owner_name: 'Dono',
      operator_name: 'Op',
      street: 'Rua',
      number: '2',
      district: 'Centro',
      city: 'SP',
      state: 'SP',
      postal_code: '01000-000',
      seller_id: null,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
  ]),
  course_categories: table([
    {
      id: 1,
      name: 'Tecnologia',
      old_id: 'abc123',
      order: 1,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
  ]),
  courses: table([
    {
      id: 1,
      name: 'Sistemas',
      duration: 24,
      duration_type: 'months',
      category_id: 1,
      old_id: null,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 2,
      name: 'Direito',
      duration: 5,
      duration_type: 'semestres',
      category_id: 999,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
  ]),
  scholarships: table([
    {
      id: 1,
      shift: 'matutino',
      type: 'semi-presencial',
      full_price: 1000.5,
      discount: 100,
      final_price: 900.5,
      quantity_offered: 10.0,
      renovation_days: 30.0,
      register_period_start: null,
      register_period_end: null,
      course_description: 'Curso completo',
      course_id: 1,
      institution_id: 1,
      is_yearly: false,
      expired: false,
      active: true,
      delete: false,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: 2,
      shift: 'noturno',
      type: 'ead',
      full_price: 500,
      discount: 50,
      final_price: 450,
      quantity_offered: 5,
      renovation_days: 30,
      course_description: 'x',
      course_id: 999,
      institution_id: 1,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  users: table([
    {
      id: 1,
      name: 'Admin',
      email: 'ADMIN@BMB.COM ',
      password: '$2a$10$hash',
      type: 'admin',
      phone: '(11)99999-0001',
      birthdate: new Date('1990-01-01'),
      rg: '1',
      rg_emissor: 'SSP',
      cpf: '111.111.111-11',
      family_income: 3500.789,
      partner_id: 1,
      register_scholarship: 1,
      institution_id: 1,
      has_dependent: false,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: NOW,
    },
    {
      id: 2,
      name: 'Admin antigo',
      email: 'admin@bmb.com',
      password: '$2a$10$hash',
      type: 'user',
      phone: '(11)99999-0002',
      birthdate: new Date('1990-01-01'),
      rg: '2',
      rg_emissor: 'SSP',
      active: false,
      delete: true,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 3,
      name: null,
      email: null,
      phone: null,
      birthdate: null,
      rg: null,
      rg_emissor: null,
      minor_name: 'Filho',
      minor_birthdate: new Date('2015-06-01'),
      has_dependent: true,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 4,
      name: 'Usuário 4',
      email: 'user4@bmb.com',
      phone: '(11)99999-0004',
      birthdate: new Date('1995-05-05'),
      rg: '4',
      rg_emissor: 'SSP',
      partner_id: 999,
      register_scholarship: 2,
      has_dependent: true,
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 5,
      name: 'Usuário 5',
      email: 'user5@bmb.com',
      phone: '(11)99999-0005',
      birthdate: new Date('1994-04-04'),
      rg: '5',
      rg_emissor: 'SSP',
      // flag desligada, mas com nome preenchido: o dependente é migrado assim mesmo
      has_dependent: false,
      minor_name: 'Enteada',
      minor_birthdate: new Date('2016-03-03'),
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 6,
      name: 'Usuário 6',
      email: 'user6@bmb.com',
      phone: '(11)99999-0006',
      birthdate: new Date('1993-03-03'),
      rg: '6',
      rg_emissor: 'SSP',
      // apenas data residual, sem nome: não vira dependente
      has_dependent: false,
      minor_name: null,
      minor_birthdate: new Date('2017-02-02'),
      active: true,
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
  ]),
  addresses: table([
    {
      id: 1,
      user_id: 1,
      street: 'Rua Antiga',
      city: 'SP',
      state: 'SP',
      number: '10',
      district: 'Centro',
      complement: null,
      postal_code: '01000-000',
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 2,
      user_id: 1,
      street: 'Rua Nova',
      city: 'SP',
      state: 'SP',
      number: '20',
      district: 'Centro',
      complement: 'ap 2',
      postal_code: '01000-001',
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: 3,
      user_id: 999,
      street: 'Rua Orfã',
      city: 'SP',
      state: 'SP',
      number: '30',
      district: 'Centro',
      postal_code: '01000-002',
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  clients: table([
    {
      id: 'cus_000123',
      name: 'Admin',
      person_type: null,
      external_reference: 1,
      cpf_cnpj: '111.111.111-11',
      birth_date: null,
      phone: '(11)99999-0001',
      created_at: EARLIER,
      updated_at: EARLIER,
    },
  ]),
  orders: table([
    {
      id: 1,
      user_id: 1,
      scholarship_id: 1,
      code: 1000,
      expired: false,
      is_renew: false,
      defaulter: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 2,
      user_id: 1,
      scholarship_id: 1,
      code: 1000,
      expired: false,
      is_renew: true,
      defaulter: false,
      created_at: NOW,
      updated_at: NOW,
    },
    { id: 3, user_id: 999, scholarship_id: 1, code: 1001, created_at: NOW, updated_at: NOW },
    { id: 4, user_id: 1, scholarship_id: 2, code: null, created_at: NOW, updated_at: NOW },
  ]),
  payments: table([
    {
      id: 1,
      user_id: 1,
      scholarship_id: 1,
      order_id: 1,
      status: 'paid',
      payment_type: 'boleto',
      full_price: 1000.5,
      final_price: 900.456,
      discount: 100,
      own_code: 'OWN1',
      installment_count: 1,
      percent: 10,
      date_paid: NOW,
      renew: false,
      active: true,
      delete: false,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: 2,
      user_id: 1,
      scholarship_id: 1,
      order_id: 3,
      status: 'PAID',
      payment_type: 'PIX',
      full_price: 10,
      final_price: 10,
      discount: 0,
      own_code: 'OWN2',
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: 3,
      user_id: 1,
      scholarship_id: 1,
      order_id: 1,
      status: null,
      payment_type: 'xyz',
      full_price: null,
      final_price: 5,
      discount: 0,
      own_code: 'OWN3',
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  signed_contracts: table([
    {
      id: 1,
      ip: '127.0.0.1',
      isMobile: true,
      user_id: 1,
      scholarship_id: 1,
      deviceInfo: 'Chrome',
      delete: false,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  indications: table([
    {
      id: 1,
      user_id: 1,
      name: 'Indicado 1',
      email: 'a@a.com',
      cell: '(11)99999-9999',
      city: 'SP',
      delete: false,
      created_at: EARLIER,
      updated_at: EARLIER,
    },
    {
      id: 2,
      user_id: 1,
      name: 'Indicado 1 dup',
      email: 'A@A.COM',
      cell: '(11)99999-9999',
      city: 'SP',
      delete: false,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: 3,
      user_id: 1,
      name: 'Indicado 2',
      email: 'b@b.com',
      cell: '(11)98888-8888',
      city: 'RJ',
      delete: false,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  call_indications: table([
    {
      id: 1,
      caller_id: 1,
      receiver_id: 2,
      description: 'ligação',
      to_return: false,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: 2,
      caller_id: 1,
      receiver_id: 999,
      description: 'órfã',
      to_return: false,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  calls: table([
    {
      id: 1,
      caller_id: 1,
      receiver_id: 999,
      description: 'sem receiver',
      to_return: true,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  notifications: table([
    {
      id: 1,
      title: 'Bem-vindo',
      message: 'Olá',
      read: false,
      user_id: 1,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  possible_partners: table([
    {
      id: 1,
      institutionName: 'Escola X',
      cnpj: '00.000.000/0003-00',
      modality: 'presencial',
      name: 'Contato',
      email: 'x@x.com',
      message: 'oi',
      cell: '(11)97777-7777',
      city: 'SP',
      numStudents: '500',
      delete: false,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  call_possible_partners: table([
    {
      id: 1,
      caller_id: 1,
      receiver_id: 1,
      description: 'ligação parceiro',
      to_return: false,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
  faqs: table([
    {
      id: 1,
      question: 'Como funciona?',
      answer: 'Assim.',
      delete: false,
      created_at: NOW,
      updated_at: NOW,
    },
  ]),
};

class FakeLegacySource {
  constructor(private readonly data: Record<string, LegacyRow[]>) {}

  async resolveTable(candidates: string[]): Promise<string | null> {
    return candidates.find((candidate) => this.data[candidate] !== undefined) ?? null;
  }

  async columns(table: string): Promise<Set<string>> {
    return new Set(Object.keys(this.data[table]?.[0] ?? {}));
  }

  async column(table: string, candidates: string[]): Promise<string | null> {
    const columns = await this.columns(table);
    return candidates.find((candidate) => columns.has(candidate)) ?? null;
  }

  async count(table: string): Promise<number> {
    return this.data[table]?.length ?? 0;
  }

  async project(table: string, columns: string[]): Promise<LegacyRow[]> {
    return (this.data[table] ?? []).map((row) => {
      const projected: LegacyRow = {};
      for (const column of columns) projected[column] = row[column] ?? null;
      return projected;
    });
  }

  async *stream(
    table: string,
    options: { batchSize: number; limit: number | null },
  ): AsyncGenerator<LegacyRow[]> {
    const rows = this.data[table] ?? [];
    const limited = options.limit === null ? rows : rows.slice(0, options.limit);
    for (let index = 0; index < limited.length; index += options.batchSize) {
      yield limited.slice(index, index + options.batchSize);
    }
  }

  async close(): Promise<void> {}
}

interface StoredRow {
  id: string;
  [key: string]: unknown;
}

/** UNIQUE constraints of the new schema that the migration has to respect. */
const UNIQUE_KEYS: Record<string, string[][]> = {
  user: [['email']],
  partner: [['code']],
  order: [['code']],
  address: [['user_id']],
  indication: [['email', 'cell']],
  externalClient: [['externalReference']],
};

class FakeStore {
  readonly tables = new Map<string, Map<string, StoredRow>>();
  readonly uniqueSkips: string[] = [];

  rows(model: string): Map<string, StoredRow> {
    const existing = this.tables.get(model);
    if (existing) return existing;
    const created = new Map<string, StoredRow>();
    this.tables.set(model, created);
    return created;
  }

  private conflict(model: string, row: StoredRow): string | null {
    for (const key of UNIQUE_KEYS[model] ?? []) {
      const signature = key.map((field) => String(row[field])).join('|');
      for (const stored of this.rows(model).values()) {
        if (stored.id === row.id) continue;
        if (key.map((field) => String(stored[field])).join('|') === signature) {
          return `${model}.${key.join('+')}=${signature}`;
        }
      }
    }
    return null;
  }

  insert(model: string, row: StoredRow, skipDuplicates: boolean): boolean {
    const rows = this.rows(model);
    if (rows.has(row.id)) {
      if (skipDuplicates) return false;
      throw new Error(`duplicate id ${model}.${row.id}`);
    }
    const conflict = this.conflict(model, row);
    if (conflict) {
      this.uniqueSkips.push(conflict);
      if (skipDuplicates) return false;
      throw new Error(`unique violation ${conflict}`);
    }
    rows.set(row.id, row);
    return true;
  }
}

function fakeDelegate(store: FakeStore, model: string) {
  return {
    createMany: async ({
      data,
      skipDuplicates,
    }: {
      data: StoredRow[];
      skipDuplicates?: boolean;
    }) => {
      let count = 0;
      for (const row of data) if (store.insert(model, row, skipDuplicates === true)) count += 1;
      return { count };
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { id: string };
      create: StoredRow;
      update: StoredRow;
    }) => {
      const rows = store.rows(model);
      rows.set(where.id, rows.has(where.id) ? { ...rows.get(where.id), ...update } : create);
      return rows.get(where.id);
    },
    findMany: async () => [...store.rows(model).values()].map((row) => ({ id: row.id })),
    count: async () => store.rows(model).size,
  };
}

const MODELS = [
  'user',
  'userIdentity',
  'address',
  'partner',
  'access',
  'seller',
  'institution',
  'courseCategory',
  'course',
  'scholarship',
  'order',
  'payment',
  'signedContract',
  'indication',
  'indicationCall',
  'minor',
  'possiblePartner',
  'possiblePartnerCall',
  'call',
  'notification',
  'faq',
  'externalClient',
] as const;

let failures = 0;

function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `  ${ok ? '✓' : '✗'} ${label}${ok ? '' : ` — esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`}`,
  );
}

async function main(): Promise<number> {
  const store = new FakeStore();
  const prismaLike: Record<string, unknown> = {};
  for (const model of MODELS) prismaLike[model] = fakeDelegate(store, model);

  const config: MigrationConfig = {
    legacyUrl: 'fake',
    targetUrl: 'fake',
    legacySsl: false,
    dryRun: false,
    reset: false,
    confirm: false,
    only: [],
    skip: [],
    batchSize: 2,
    limit: null,
    onConflict: 'skip',
    reportPath: '',
  };

  const prisma = prismaLike as unknown as PrismaClient;
  const loaders: Record<string, () => Promise<{ id: string }[]>> = {};
  for (const model of MODELS) {
    loaders[model] = fakeDelegate(store, model).findMany;
  }

  const ctx: MigrationContext = {
    config,
    legacy: new FakeLegacySource(fixtures) as unknown as LegacySource,
    prisma,
    report: new MigrationReport(),
    ids: new IdRegistry(loaders),
  };

  console.log('\n== Executando o pipeline de migração em memória ==\n');
  await runSteps(ctx, steps, (message) => console.log(message));

  const rows = (model: string): StoredRow[] => [...store.rows(model).values()];
  const byId = (model: string, id: string): StoredRow | undefined => store.rows(model).get(id);

  console.log('\n== Verificações ==\n');

  check('nenhuma violação de UNIQUE', store.uniqueSkips, []);
  check('nenhum erro de gravação', ctx.report.hasErrors(), false);

  console.log(' catálogo');
  check('sellers migrados + placeholder', rows('seller').length, 3);
  check('seller sem nome vira string vazia', byId('seller', legacyId('seller', '2'))?.['name'], '');
  check('partners migrados', rows('partner').length, 2);
  check(
    'código duplicado renomeado',
    byId('partner', legacyId('partner', '2'))?.['code'],
    'ABC-legacy2',
  );
  check('access órfão descartado', rows('access').length, 1);
  check('institutions migradas', rows('institution').length, 2);
  check(
    'instituição sem vendedor usa placeholder',
    byId('institution', legacyId('institution', '2'))?.['seller_id'],
    legacyId('seller', 'migracao-sem-vendedor'),
  );
  check(
    'email vazio da instituição vira null',
    byId('institution', legacyId('institution', '1'))?.['email'],
    null,
  );
  check('categorias + placeholder', rows('courseCategory').length, 2);
  check('cursos migrados', rows('course').length, 2);
  check(
    'duration_type mapeado',
    byId('course', legacyId('course', '1'))?.['duration_type'],
    'MONTHS',
  );
  check(
    'duration_type desconhecido usa MONTHS',
    byId('course', legacyId('course', '2'))?.['duration_type'],
    'MONTHS',
  );
  check(
    'curso sem categoria usa placeholder',
    byId('course', legacyId('course', '2'))?.['category_id'],
    legacyId('courseCategory', 'migracao-sem-categoria'),
  );

  console.log(' bolsas');
  check('bolsa com curso órfão descartada', rows('scholarship').length, 1);
  check(
    'type mapeado para enum',
    byId('scholarship', legacyId('scholarship', '1'))?.['type'],
    'SEMI_PRESENCIAL',
  );
  check(
    'FLOAT vira DECIMAL string',
    byId('scholarship', legacyId('scholarship', '1'))?.['full_price'],
    '1000.50',
  );
  check(
    'quantity_offered vira inteiro',
    byId('scholarship', legacyId('scholarship', '1'))?.['quantity_offered'],
    10,
  );
  check(
    'register_period_start nulo usa created_at',
    (
      byId('scholarship', legacyId('scholarship', '1'))?.['register_period_start'] as Date
    ).toISOString(),
    NOW.toISOString(),
  );

  console.log(' pessoas');
  check('usuários migrados', rows('user').length, 6);
  check('e-mail normalizado', byId('user', legacyId('user', '1'))?.['email'], 'admin@bmb.com');
  check(
    'e-mail duplicado desambiguado',
    byId('user', legacyId('user', '2'))?.['email'],
    'admin+legacy2@bmb.com',
  );
  check(
    'e-mail vazio gerado',
    byId('user', legacyId('user', '3'))?.['email'],
    'legacy-user-3@migrado.brasilmaisbolsas.local',
  );
  check(
    'birthdate nulo usa data sentinela',
    (byId('user', legacyId('user', '3'))?.['birthdate'] as Date).toISOString(),
    '1900-01-01T00:00:00.000Z',
  );
  check(
    'family_income vira DECIMAL string',
    byId('user', legacyId('user', '1'))?.['family_income'],
    '3500.79',
  );
  check('partner_id órfão vira null', byId('user', legacyId('user', '4'))?.['partner_id'], null);
  check(
    'register_scholarship órfão vira null',
    byId('user', legacyId('user', '4'))?.['register_scholarship'],
    null,
  );
  check('endereço duplicado: fica o mais recente', rows('address').length, 1);
  check('endereço mantido é o mais novo', rows('address')[0]?.['street'], 'Rua Nova');
  check('dependentes viram registros em Minor', rows('minor').length, 2);
  check(
    'minor vinculado ao usuário',
    byId('minor', legacyId('minor', 'user-3'))?.['user_id'],
    legacyId('user', '3'),
  );
  check(
    'nome preenchido com has_dependent=false é migrado',
    byId('minor', legacyId('minor', 'user-5'))?.['name'],
    'Enteada',
  );
  check(
    'data residual sem nome não vira dependente',
    byId('minor', legacyId('minor', 'user-6')),
    undefined,
  );
  check(
    'has_dependent sem nome não vira dependente',
    byId('minor', legacyId('minor', 'user-4')),
    undefined,
  );
  check('cliente externo migrado', rows('externalClient').length, 1);
  check('id do gateway preservado', rows('externalClient')[0]?.['id'], 'cus_000123');
  check('personType inferido pelo CPF', rows('externalClient')[0]?.['personType'], 'FISICA');
  check(
    'externalReference aponta para o novo id',
    rows('externalClient')[0]?.['externalReference'],
    legacyId('user', '1'),
  );

  console.log(' pedidos e pagamentos');
  check('pedidos órfãos descartados', rows('order').length, 2);
  check('code duplicado regerado', byId('order', legacyId('order', '2'))?.['code'], 1002);
  check('pagamentos com pedido válido', rows('payment').length, 2);
  check(
    'payment_type mapeado',
    byId('payment', legacyId('payment', '1'))?.['payment_type'],
    'BOLETO',
  );
  check(
    'payment_type desconhecido vira UNDEFINED',
    byId('payment', legacyId('payment', '3'))?.['payment_type'],
    'UNDEFINED',
  );
  check('status normalizado', byId('payment', legacyId('payment', '1'))?.['status'], 'PAID');
  check(
    'status nulo vira UNDEFINED',
    byId('payment', legacyId('payment', '3'))?.['status'],
    'UNDEFINED',
  );
  check(
    'preço arredondado para 2 casas',
    byId('payment', legacyId('payment', '1'))?.['final_price'],
    '900.46',
  );
  check('contrato assinado migrado', rows('signedContract').length, 1);
  check('deviceInfo camelCase lido', rows('signedContract')[0]?.['deviceInfo'], 'Chrome');

  console.log(' CRM');
  check('indicação duplicada descartada', rows('indication').length, 2);
  check('ligação de indicação migrada', rows('indicationCall').length, 1);
  check(
    'ligação remapeada para a indicação mantida',
    rows('indicationCall')[0]?.['indication_id'],
    legacyId('indication', '1'),
  );
  check('ligação migrada', rows('call').length, 1);
  check('receiver órfão vira null', rows('call')[0]?.['receiver_id'], null);
  check('notificação migrada', rows('notification').length, 1);
  check('possível parceiro migrado', rows('possiblePartner').length, 1);
  check('numStudents camelCase lido', rows('possiblePartner')[0]?.['numStudents'], '500');
  check('ligação de possível parceiro migrada', rows('possiblePartnerCall').length, 1);
  check('faq migrada', rows('faq').length, 1);

  ctx.report.printSummary(false);

  console.log(
    failures === 0 ? '\n✅ Smoke test OK\n' : `\n❌ ${failures} verificação(ões) falharam\n`,
  );
  return failures === 0 ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error('Smoke test falhou:', error);
    process.exitCode = 1;
  });
