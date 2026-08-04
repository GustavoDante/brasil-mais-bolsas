/**
 * Mock do PrismaClient para testes unitarios.
 * Evita o problema de `import.meta` (ESM) do cliente Prisma gerado
 * ao rodar sob o Jest em modo CommonJS.
 *
 * Todos os modelos do Prisma sao expostos como objetos com metodos jest.fn().
 * Adicionar novos modelos conforme o schema crescer.
 */
const createModelMock = () => {
  const findUnique = jest.fn();
  return {
    findUnique,
    // Alias findFirst to findUnique for backward compatibility in tests
    findFirst: findUnique,
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  };
};

export const PrismaClient = jest.fn().mockImplementation(() => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  user: createModelMock(),
  userIdentity: createModelMock(),
  address: createModelMock(),
  partner: createModelMock(),
  access: createModelMock(),
  seller: createModelMock(),
  institution: createModelMock(),
  courseCategory: createModelMock(),
  course: createModelMock(),
  scholarship: createModelMock(),
  order: createModelMock(),
  payment: createModelMock(),
  signedContract: createModelMock(),
  indication: createModelMock(),
  indicationCall: createModelMock(),
  minor: createModelMock(),
  possiblePartner: createModelMock(),
  possiblePartnerCall: createModelMock(),
  call: createModelMock(),
  notification: createModelMock(),
  faq: createModelMock(),
  externalClient: createModelMock(),
}));

// Re-exporta o namespace Prisma vazio para satisfazer imports de tipos
export const Prisma = {
  Decimal: class Decimal {
    constructor(value: string | number) {
      return value;
    }
  },
};

export const DurationType = {
  DAYS: 'DAYS',
  MONTHS: 'MONTHS',
  YEARS: 'YEARS',
};

export const ScholarshipType = {
  PRESENCIAL: 'PRESENCIAL',
  SEMI_PRESENCIAL: 'SEMI_PRESENCIAL',
  EAD: 'EAD',
};

export const PaymentType = {
  BOLETO: 'BOLETO',
  CREDIT_CARD: 'CREDIT_CARD',
  PIX: 'PIX',
  INTEREST: 'INTEREST',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
  UNDEFINED: 'UNDEFINED',
};

export const PersonType = {
  FISICA: 'FISICA',
  JURIDICA: 'JURIDICA',
};

// Helpers de conexão de `@repo/db`. O `PrismaService` chama `createPrismaConnection()`
// no construtor, então sem este stub qualquer teste que instancie o service tentaria
// abrir um Pool de verdade contra o Postgres.
export const createPrismaConnection = jest.fn(() => ({
  adapter: {},
  pool: { end: jest.fn().mockResolvedValue(undefined) },
}));

export const getPrisma = jest.fn(() => new (PrismaClient as unknown as new () => unknown)());
