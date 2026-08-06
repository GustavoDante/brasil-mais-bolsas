# CLAUDE.md — Brasil Mais Bolsas API (Backend)

Guidance for Claude Code when working in this repository. This file is the single
source of truth for project rules (there is no separate `AGENTS.md`/`AGENTS.MD`).
**Any new pattern adopted in the project must be documented here before it is
considered established.**

## Stack

- **NestJS 11** + **TypeScript 5** (strict; `any` and `@ts-ignore` are banned)
- **Prisma 7** ORM with **PostgreSQL** (`@prisma/adapter-pg` / `pg`)
- **JWT auth** via `@nestjs/jwt` + **Passport** (local + jwt strategies), **bcrypt**
- **nestjs-zod** + **Zod 4** for DTO validation — os schemas vêm de `@repo/contracts`
- **@nestjs/swagger** (OpenAPI), **@nestjs/throttler** (rate limit), **helmet** (HTTP headers)
- **Jest** for unit / e2e / integration tests

## Commands

Esta API faz parte de um monorepo pnpm — veja o [CLAUDE.md da raiz](../../CLAUDE.md).
**Nunca use `npm` aqui dentro.**

```bash
pnpm --filter api run dev              # dev server com watch
pnpm --filter api run start:prod       # roda o build (node dist/main)
pnpm --filter api run build            # nest build → dist/
pnpm --filter api run lint             # eslint --fix em src, test
pnpm --filter api run format           # prettier --write

pnpm --filter api run test             # unitários (*.spec.ts, co-locados em src/)
pnpm --filter api run test:e2e         # e2e (test/e2e/**, supertest)
pnpm --filter api run test:integration # integração (recursos externos reais)
pnpm --filter api run test:cov         # unitários com cobertura

pnpm --filter api run db:migrate:legacy        # importa os dados da API antiga (Sequelize)
pnpm --filter api run db:migrate:legacy:dry    # mesma importação em modo simulação
pnpm --filter api run db:migrate:legacy:smoke  # valida o pipeline em memória (sem banco)
```

Banco e schema **não moram mais aqui** — estão em `packages/db`. Da raiz:

```bash
pnpm db:generate   # client Prisma + schemas Zod de @repo/contracts
pnpm db:migrate    # prisma migrate dev
pnpm db:seed
```

## Runtime shape (see `src/main.ts`)

- Global route prefix **`/v1`** — controllers must NOT repeat it.
- Global `ZodValidationPipe` (nestjs-zod) → toda entrada precisa de um DTO criado com
  `createZodDto` sobre um schema de `@repo/contracts`. Nunca aceite dado sem validação.
- Global `AllExceptionsFilter` (`src/common/filters/`) standardizes errors as
  `{ ok: false, code, message, statusCode, timestamp, path, fieldErrors? }`; stack traces
  are logged, never returned. Lance sempre `AppException('<code>')` — nunca as exceções do
  Nest; status e mensagem vêm do `ERROR_CATALOG` de `@repo/contracts`.
- Global `ThrottlerGuard` — 100 req / 60s per IP. Tighten sensitive routes with `@Throttle()`.
- `helmet()` on; CORS driven by `ALLOWED_ORIGINS` (empty = CORS disabled).
- Swagger UI at **`/docs`** (dev, or `SWAGGER_ENABLED=true`).

## Project structure

```
src/
  main.ts                  # bootstrap: prefix, pipes, filters, helmet, swagger
  app.module.ts            # root module (throttler, feature modules)
  modules/<domain>/        # one folder per domain: controller, service, module,
                           #   dto/, guards/, strategies/, entities/, repositories/
  integrations/<name>/     # external clients (e.g. asaas/, gerencianet/, sicoob/,
                           #   wirecard/, mail/) — isolated adapters
  jobs/                     # scheduled/background jobs (e.g. check-orders-for-renewal.job.ts)
  database/prisma/         # PrismaModule + PrismaService (central DB access)
  common/                  # cross-cutting: config/, decorators/, guards/, interceptors/,
                           #   filters/ (AllExceptionsFilter lives here), middlewares/,
                           #   pipes/, validators/, constants/, types/, utils/
  templates/mail/           # email templates
  __mocks__/               # prisma-client.mock.ts (see testing note below)
scripts/
  legacy-migration/        # importação dos dados da API antiga (Sequelize) — ver README da pasta
test/                      # e2e (test/e2e/) + integration + jest configs
```

This structure exists to support the volume of the previous project (which had many
controllers, models and services) by prioritizing modularization by domain and clear
layer separation:

- Each domain lives in `src/modules/<domain>` with its own controller, service, DTOs,
  entities and repositories.
- External integrations live in `src/integrations` with isolated adapters/clients.
- Shared and cross-cutting code lives in `src/common`.
- O acesso ao banco é centralizado em `src/database/prisma` (`PrismaService`), mas o
  **schema e as migrations vivem em `packages/db`** — fora deste app, porque são
  compartilhados com a geração dos contratos.
- Jobs and scheduled tasks live in `src/jobs`.

## Regras obrigatórias

- Sempre consultar o MCP do Context7 antes de adicionar ou integrar uma nova biblioteca.
  Usar a versão LTS mais recente e seguir a documentação oficial para garantir boas práticas.
- Não usar `any` em TypeScript. Em casos excepcionais, criar tipos específicos ou usar
  `unknown` com validação explícita.
- Não usar `@ts-ignore`. Corrigir a tipagem ou documentar com `@ts-expect-error` apenas
  quando for inevitável, com comentário justificando.
- Manter módulos de feature isolados. Expor apenas o que for necessário via `exports` e
  importar explicitamente.
- Controllers devem existir dentro de um módulo e serem registrados no `@Module()` correspondente.
- Providers devem ser injetados via DI. Evitar uso direto de `new` fora de factories
  controladas pelo Nest.
- Middleware deve ser configurado via `NestModule.configure()` e não no `@Module()`.
- Manter regras de lint e Prettier ativas. Não desabilitar regras sem justificativa técnica
  documentada.
- Validação de entrada deve ser obrigatória (DTOs + pipes). Nunca confiar em dados sem validação.
- Seguir padrões de nomenclatura consistentes e pastas organizadas por domínio.

## Key conventions

- **Feature isolation:** keep domains in `src/modules/<domain>`. Register controllers
  and providers in their `@Module()`; export only what other modules need. Inject via DI.
- **Prisma vem de `@repo/db`** — `import { PrismaClient, Prisma, ScholarshipType } from '@repo/db'`.
  O schema e as migrations moram em `packages/db`; rode `pnpm db:generate` na raiz após
  mudar o schema e `pnpm db:migrate` para criar migration — nunca escreva SQL à mão.
- **Prisma + Jest gotcha:** o client Prisma 7 usa `import.meta` (ESM puro), incompatível
  com o Jest em CommonJS. Um `moduleNameMapper` em `package.json`, `test/jest-e2e.json` e
  `test/jest-integration.json` redireciona `@repo/db` para `src/__mocks__/prisma-client.mock.ts`.
  **Não remova.** Ao adicionar um model no schema, adicione-o também ao mock. Injete o
  Prisma nos testes via `{ provide: PrismaService, useValue: prismaMock }`.
- **Tests are part of every change.** Creating/editing a module means creating/updating
  its `*.spec.ts` (co-located) and relevant `test/e2e/*.e2e-spec.ts` in the same delivery.
  Cover happy path, invalid input, edge cases, and error handling. Use `it()` (not `test()`),
  with descriptions in Portuguese. Mock external dependencies (Prisma, other services, bcrypt).
- **Swagger is mandatory** for public controllers: `@ApiTags`, `@ApiOperation`,
  `@ApiResponse` (with dedicated response DTOs), `@ApiBearerAuth` on protected routes,
  and `@ApiProperty({ description, example })` on DTO fields.
- **Before adding a library:** consult the Context7 MCP for current docs and use the
  latest LTS. Follow official best practices rather than memory.

## Padrões obrigatórios (detalhes e exemplos)

### Validação de entrada (DTOs)

**A regra de validação não mora aqui.** Ela vive em `packages/contracts/src/<módulo>`, e é
a mesma que o frontend usa. O DTO deste app é só a casca que liga o schema ao Nest:

```typescript
import { LoginSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class LoginDto extends createZodDto(LoginSchema) {}
```

- O `ZodValidationPipe` global está em `main.ts`. **Nunca** volte a registrar o
  `ValidationPipe` do class-validator: ao ver um `ZodDto` (que não tem decorators) com
  `whitelist`/`forbidNonWhitelisted`, ele apaga todos os campos e a rota responde 400.
  Os dois não coexistem — foi por isso que a migração teve de ser feita de uma vez.
- Precisa de campo novo numa rota? Edite o schema em `@repo/contracts`, não o DTO.
- Equivalências com o `ValidationPipe` antigo, que precisam estar **explícitas no schema**:

| Antes | Agora |
| --- | --- |
| `forbidNonWhitelisted` (400 em campo extra) | `.strict()` no schema de body |
| `whitelist` (remove campo não declarado) | padrão do Zod |
| `transform` (query `"10"` → `10`) | blocos `zQuery*` |
| `@Type(() => Date)` + `@IsDate()` | `zDateInput()` |

- **Rota que aceita `multipart/form-data` precisa dos blocos `zQuery*` também no body.**
  Em multipart todo campo chega como string; sem coerção, `students_count: "200"` vira 400.
  É o caso de `CreateInstitutionSchema`.
- O **webhook do Asaas é o único** schema de entrada sem `.strict()`: o payload é de
  terceiro e ganha campos sem aviso — rejeitar campo desconhecido derrubaria a baixa de
  pagamento.
- Erro de validação vira 400 com `fieldErrors` (`{ campo: [mensagens] }`), montado pelo
  `AllExceptionsFilter` a partir do `ZodValidationException`. É o que o formulário do web
  usa para marcar o input errado.

### Rate limiting (proteção contra brute-force)

- O `ThrottlerModule` está configurado globalmente no `AppModule` com limite de
  **100 requisições por 60 segundos por IP**.
- O `ThrottlerGuard` é aplicado via `APP_GUARD`, cobrindo todos os controllers automaticamente.
- Rotas sensíveis (autenticação, reset de senha, etc.) devem ter limite próprio mais
  restrito usando `@Throttle()` no nível do método:

```typescript
// Limite específico para login: 10 tentativas por minuto por IP
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Post('login')
async login(...) {}
```

- Rotas públicas sem risco (ex: health check) podem desabilitar o throttler com `@SkipThrottle()`.

### Segurança HTTP (Helmet + CORS)

- `helmet()` está configurado em `main.ts` e deve permanecer ativo. Ele seta headers de
  segurança HTTP como `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` etc.
- CORS é configurado via variável de ambiente `ALLOWED_ORIGINS` (lista separada por vírgula).
- Se `ALLOWED_ORIGINS` estiver vazia, CORS fica desabilitado (seguro para uso server-to-server).
- Nunca usar `app.enableCors()` sem restrição de origem em produção.

```env
# .env — exemplo
ALLOWED_ORIGINS=https://seusite.com.br,https://admin.seusite.com.br
```

### Erros: `AppException` e o catálogo (obrigatório)

**Nunca lance `NotFoundException`, `BadRequestException` e afins.** O status HTTP e a
mensagem de um erro são definidos uma vez só, no `ERROR_CATALOG` de `@repo/contracts`:

```ts
import { AppException } from '../../common/exceptions/app.exception';

if (!user) throw new AppException('user-not-found');   // 404 + "Usuário não encontrado."
```

O `code` é tipado (`ErrorCode`), então um slug que não está no catálogo **não compila** —
não existe mais o `throw new NotFoundException('user-not-fond')` que passa batido.

**Código novo:** adicione a entrada em `packages/contracts/src/errors.ts` com o status e o
texto em pt-BR. Não escreva mensagem no service; se você precisa de um texto diferente, o
que falta é um código novo. A única exceção é a opção `{ message }`, reservada para erro de
terceiro cujo texto nasce fora (a descrição que o Asaas devolve) — veja `asaas.service.ts`.

Convenção de nomes: `<recurso>-not-found` (404) quando a busca falha e `invalid-<recurso>`
(400) quando o recurso veio referenciado no corpo da requisição.

**O filtro.** `AllExceptionsFilter` (`src/common/filters/`) é registrado globalmente em
`main.ts` e é o único lugar que transforma exceção em resposta. Toda falha sai como:

```json
{ "ok": false, "code": "user-not-found", "message": "Usuário não encontrado.",
  "statusCode": 404, "timestamp": "…", "path": "/v1/users/…", "fieldErrors": {} }
```

Quatro caminhos, nesta ordem: `AppException` → catálogo; `ZodValidationException` →
`validation-error` + `fieldErrors`; `HttpException` de terceiros (throttler, Multer,
guards) → código genérico pelo status, **descartando** o texto técnico em inglês; qualquer
outra coisa → `internal-error`, sem a mensagem original (ela pode conter query ou string de
conexão). Erros `>= 500` vão para o log com stack trace; stack **nunca** vai na resposta.

`test/e2e/errors.e2e-spec.ts` cobre os quatro caminhos — é o teste que segura o contrato do
corpo de erro, já que os demais e2e só olham status.

- Filtros de exceção específicos por domínio, se algum dia forem necessários, ficam em
  `src/common/filters/` e são registrados no módulo, não globalmente.

### Prefixo global de versão

- Todas as rotas da API usam o prefixo `/v1`, configurado em `main.ts` via
  `app.setGlobalPrefix('v1')`.
- Novos módulos não precisam repetir `/v1` nos seus controllers — o prefixo é aplicado
  automaticamente.

### Autenticação (JWT + Passport)

- Autenticação é baseada em JWT (access token de curta duração, padrão 24h configurável
  via `JWT_EXPIRES_IN`).
- `LocalStrategy` valida email + senha/CPF via bcrypt.
- `JwtStrategy` valida o token e popula `req.user` com
  `{ userId, email, type, institution_id? }`.
- Guards de autenticação ficam em `src/modules/auth/guards/`. Guards reutilizáveis em
  múltiplos módulos ficam em `src/common/guards/`.
- O payload do JWT contém `{ sub, email, type }` e, para quem tem vínculo com uma
  instituição (gestor), `institution_id` — a chave de escopo que `/v1/institutions`,
  `/v1/courses`, `/v1/scholarships/list/backoffice` e `/v1/reports/*` leem de `req.user`.
  Nunca dados sensíveis.
- **Claim nova só alcança sessão já emitida depois de rotacionar `JWT_SECRET`** (ou de
  passar o `JWT_EXPIRES_IN`). Até lá as rotas que escopam por `institution_id` se comportam
  como se o usuário não tivesse vínculo — no caso do gestor, isso significa `[]` em
  `/v1/institutions` e listagem sem escopo nas demais. Rotação entra no runbook do deploy.
- **Quem escopa por `institution_id` checa `type === 'manager'` antes.** Ler
  `req.user.institution_id` cru restringe também o admin que por acaso tenha vínculo, e faz
  o `?institution=` dele parar de funcionar sem erro nenhum. `reports.controller.ts` faz
  isso nas duas rotas (`/general` e `/impact`); `orders.service.ts` (`resolveManagerInstitutionId`)
  ainda resolve pelo banco quando a claim falta — de propósito, porque cobre também o admin
  que troca a instituição de um gestor no meio da sessão.
- Rotas protegidas usam `@UseGuards(JwtAuthGuard)`. Rotas públicas não precisam de
  decorador adicional (o guard não é global).

## Swagger (documentação obrigatória)

- Todo módulo com controller público deve ter documentação Swagger.
- Usar `@ApiTags`, `@ApiOperation`, `@ApiResponse` e `@ApiBearerAuth` quando aplicável.
- **O `SwaggerModule.setup` envolve o documento em `cleanupOpenApiDoc()`** (nestjs-zod).
  Sem isso os `ZodDto` aparecem vazios em `/docs`.
- **DTOs de request não têm `@ApiProperty`.** O schema OpenAPI é gerado do Zod, então as
  restrições reais (`minLength`, `format: email`, `additionalProperties: false`) aparecem
  sozinhas — e não podem divergir da validação, porque são a mesma coisa. Descrição e
  exemplo vêm do `.meta({ id, description })` no schema em `@repo/contracts`.
- **DTOs de response continuam classes com `@ApiProperty`.** Eles não participam de
  validação; convertê-los seria risco sem ganho.
- **Melhores práticas de documentação**:
  - **Descrições e exemplos**: todo `@ApiProperty` deve conter `description` e `example` claros.
  - **DTOs de resposta**: criar classes específicas para respostas de sucesso (ex:
    `MyResponseDto`) e usá-las em `@ApiResponse({ status: 200, type: MyResponseDto })`.
    Evitar retornar entidades do Prisma diretamente ou objetos genéricos.
  - **Documentação de erros**: documentar ao menos os status de erro esperados (`400`,
    `401`, `403`, `404`, `422`, `429`) nas rotas relevantes com `@ApiResponse`.
  - **Segurança**: rotas protegidas devem obrigatoriamente ter `@ApiBearerAuth()`.
  - **Operações**: `@ApiOperation` deve ter um `summary` curto e, se necessário, uma
    `description` mais detalhada do fluxo.
- A documentação fica disponível em `/docs` (ex: `http://localhost:3000/docs`).

## Testes (obrigatório)

### Regra geral

- **Ao criar ou editar qualquer módulo, os testes correspondentes devem ser criados ou
  atualizados na mesma entrega.**
- Testes são parte do módulo — não são opcionais nem postergáveis.
- O agente também é responsável por executar testes de requisição (e2e) para validar o
  comportamento real da API com cenários distintos.

### Testes unitários (\*.spec.ts)

- Cada `service` deve ter seu `.spec.ts` co-localizado na mesma pasta.
- Usar `@nestjs/testing` com `Test.createTestingModule()` e mocks dos providers.
- Mockar dependências externas (Prisma, serviços de outros módulos, JwtService, etc.)
  usando `jest.fn()` ou objetos de mock parcial.
- Nunca conectar ao banco real em testes unitários.
- Testar ao menos: caminho feliz, entradas inválidas, casos de borda e tratamento de erros.

#### Mock do PrismaClient (obrigatório)

O cliente Prisma v7, gerado em `packages/db/generated/prisma`, usa `import.meta` (ESM
puro), incompatível com o Jest em modo CommonJS. Por isso existe um mock manual em
`src/__mocks__/prisma-client.mock.ts`.

Como a API importa tudo que é Prisma por `@repo/db`, o `moduleNameMapper` intercepta esse
único especificador. Ele está em **três** arquivos e os três precisam concordar:

| Arquivo | Mapeamento |
| --- | --- |
| `package.json` (bloco `jest`) | `"^@repo/db$": "<rootDir>/__mocks__/prisma-client.mock.ts"` |
| `test/jest-e2e.json` | `"^@repo/db$": "<rootDir>/../src/__mocks__/prisma-client.mock.ts"` |
| `test/jest-integration.json` | idem ao e2e |

O `rootDir` difere (`src` no unitário, `test` nos outros), por isso o caminho relativo
muda — mas a chave é a mesma nos três.

- **Não remover esses mapeamentos.** Sem eles, todo teste que importe qualquer coisa
  ligada ao Prisma falha no carregamento do módulo.
- Campo novo no `schema.prisma` que os testes usem ⇒ acrescente ao mock. Ele é escrito à
  mão de propósito: um mock gerado traria o `import.meta` de volta.
- Ao adicionar um novo modelo no schema, adicionar o modelo correspondente no mock em
  `src/__mocks__/prisma-client.mock.ts`.
- O `PrismaService` deve ser injetado via `{ provide: PrismaService, useValue: prismaMock }`
  nos testes — nunca instanciado diretamente.

#### Mock de bibliotecas com propriedades não-configuráveis (ex: bcrypt)

Algumas bibliotecas exportam métodos como propriedades non-writable, impedindo
`jest.spyOn`. Nesses casos, usar `jest.mock()` no nível do módulo:

```typescript
// No topo do arquivo, antes dos imports de implementação:
jest.mock('bcrypt');

// No teste:
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
```

Estrutura esperada por módulo:

```
src/modules/auth/
  auth.service.ts
  auth.service.spec.ts    <- testa AuthService isolado
  auth.controller.ts
  auth.controller.spec.ts <- testa AuthController com guards mockados
```

Exemplo de estrutura de teste de service:

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmail: jest.fn(), toSafeUser: jest.fn() } },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('deve retornar null se usuario nao existir', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    const result = await service.validateUser('x@x.com', '123456');
    expect(result).toBeNull();
  });
});
```

### Testes de integração (\*.integration-spec.ts)

- Ficam em `test/integration/`.
- Testam a comunicação real com recursos externos (APIs de terceiros como Asaas, Banco
  de Dados real se aplicável, etc.).
- **Não** devem ser rodados em todo commit no CI se dependerem de rede externa instável,
  mas são obrigatórios para validar integrações.
- Usar `test:integration` para executar.

### Testes e2e (\*.e2e-spec.ts)

- Ficam em `test/e2e/`.
- Usar `supertest` com `app.getHttpServer()` para fazer requisições HTTP reais contra a
  aplicação em memória.
- O arquivo e2e deve cobrir **cenários distintos por rota**: sucesso, autenticação
  inválida, payload inválido, rate limit, etc.
- Dependências externas (como AsaasService) **devem ser mockadas** nos testes E2E para
  garantir que o teste seja rápido, determinístico e não dependa de rede.
- Usar `beforeAll` / `afterAll` para subir e derrubar a aplicação uma vez por suite (performance).
- Quando a rota exige autenticação, obter o token via `POST /v1/auth/login` dentro do
  próprio teste.
- O `test/jest-e2e.json` deve manter `moduleNameMapper` para redirecionar
  `generated/prisma/client` para `src/__mocks__/prisma-client.mock.ts`, evitando falha
  de `import.meta` do Prisma v7 em ambiente Jest CommonJS.
- Em e2e, quando o objetivo for validar fluxo HTTP/guards/validação sem banco real,
  sobrescrever providers de services com `overrideProvider(...).useValue(...)` no
  `TestingModule`, mantendo a aplicação completa em memória e comportamento de
  controllers/guards/pipes/filtros.

Exemplo de estrutura e2e:

```typescript
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    // aplicar os mesmos pipes/filters do main.ts
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/auth/login — credenciais validas → 201', () =>
    request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'user@test.com', password: '123456' })
      .expect(201));

  it('POST /v1/auth/login — senha errada → 401', () =>
    request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'user@test.com', password: 'errada' })
      .expect(401));

  it('POST /v1/auth/login — payload invalido → 400', () =>
    request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'nao-e-email', password: '123' })
      .expect(400));

  it('GET /v1/auth/me — sem token → 401', () =>
    request(app.getHttpServer()).get('/v1/auth/me').expect(401));
});
```

### Convenções

- Nomes de arquivos: `<nome>.spec.ts` (unitário) e `<nome>.e2e-spec.ts` (integração).
- `describe` externo = nome do módulo/classe. `describe` interno = nome do método ou cenário.
- Mensagens de `it()` em português, descrevendo o comportamento esperado com clareza.
- Não usar `test()` — padronizar em `it()`.
- Rodar `npm run test` (unitários) e `npm run test:e2e` (integração) para validar antes
  de considerar a entrega concluída.

## Arquitetura de Testes E2E (Modularizada)

Os testes e2e são organizados **por domínio** para facilitar manutenção e
escalabilidade. Cada arquivo testa um ou mais endpoints relacionados a um módulo
específico, reutilizando setup compartilhado.

### Estrutura de arquivos

```
test/
  e2e/
    shared.ts                    <- Mock definitions, test data, app initialization
    auth.e2e-spec.ts             <- POST /login, GET /me
    users.e2e-spec.ts            <- GET /users, GET /me, POST, PUT, DELETE
    courses.e2e-spec.ts          <- GET, GET /institution, POST, PUT, DELETE, PATCH
    course-categories.e2e-spec.ts <- GET, GET /:id, POST, PUT, DELETE, PATCH
    institutions.e2e-spec.ts     <- GET, GET /search, POST, PUT, DELETE, PATCH
    scholarships.e2e-spec.ts     <- GET /search, GET /list, POST, PUT, DELETE, PATCH
    ... um arquivo por domínio adicional (calls, faq, indications, notifications,
        orders, partners, payments, possible-partners, reports, sellers)
  jest-e2e.json                  <- Configuração do Jest para e2e (com moduleNameMapper para Prisma)
  app.e2e-spec.ts                <- (LEGADO) Pode ser removido; testes já existem em arquivos por domínio
```

### Arquivo shared.ts

Centraliza:

- **Mocks**: `authServiceMock`, `usersServiceMock`, `coursesServiceMock`, etc.
- **Test Data**: `validUser`, `adminUser`, `managerUser`, `validCreateCoursePayload`, etc.
- **Helpers**: `setupAuthServiceMocks()`, `setupUsersServiceMocks()`, etc.
- **App Initialization**: `createTestApp()` — retorna app + tokens (admin, manager, user)

**Uso (em cada arquivo de domínio)**:

```typescript
import { createTestApp, adminToken, validCreateCoursePayload } from './shared';

describe('Courses (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    adminToken = tokens.adminToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ... testes
});
```

### Execução local

```bash
# Rodar todos os testes e2e
npm run test:e2e

# Rodar apenas um arquivo de domínio (ex: auth)
npm run test:e2e -- auth.e2e-spec.ts

# Rodar com verbose
npm run test:e2e -- --verbose

# Rodar e cobrir cobertura
npm run test:e2e -- --coverage
```

### Cobertura esperada

Consulte [test/e2e/COVERAGE_MATRIX.md](./test/e2e/COVERAGE_MATRIX.md) para a matriz de
endpoints × cenários testados (200, 400, 401, 403, 429).

## Tarefas agendadas (`src/jobs`)

Agendamento com **@nestjs/schedule** (`ScheduleModule.forRoot()` no `AppModule`).

- Cada job tem duas partes: `*.service.ts` com a regra de negócio (testável, sem cron) e
  `*.job.ts` só com o `@Cron`. Nunca coloque regra dentro do arquivo de agendamento.
- Todo job usa `waitForCompletion: true` (não sobrepõe execuções), `unrefTimeout: true`,
  `timeZone` de `JOBS_TIMEZONE` (padrão `America/Sao_Paulo`) e `name` explícito.
- `JOBS_ENABLED=false` desliga todos os agendamentos sem remover código.
- `GET /v1/jobs` lista os agendamentos (admin) e `POST /v1/jobs/<job>/run` executa sob
  demanda — é assim que se testa um job sem esperar o horário.
- O serviço do job devolve um **resumo** (`scanned/renewed/skipped/failed` + itens com
  motivo) em vez de só logar; a rota manual expõe esse resumo.
- Chamada externa (gateway de pagamento) **fora** de transação de banco, com compensação
  explícita se a persistência falhar.

Jobs existentes:

| Job | Cron | O que faz |
| --- | --- | --- |
| `orders-renewal` | `0 3 * * *` | Porte do `checkOrdersForRenovation` do legado: 180 dias após o pagamento confirmado, encerra o pedido e abre a renovação com link de pagamento do Asaas (30% da mensalidade em até 4x). |

Variáveis: `JOBS_ENABLED`, `JOBS_TIMEZONE`, `ORDERS_RENEWAL_CRON`,
`ORDERS_RENEWAL_TRIGGER_DAYS`, `ORDERS_RENEWAL_GRACE_DAYS`, `ORDERS_RENEWAL_PERCENT`,
`ORDERS_RENEWAL_MAX_INSTALLMENTS`, `ORDERS_RENEWAL_DUE_DATE_LIMIT_DAYS`.

## Upload de arquivos (S3)

Porte do `src/services/uploadImage.js` do projeto antigo (`multer-s3` com credenciais no
código-fonte). Agora o fluxo é: `FileInterceptor` (memória) → `SecureFileValidator` →
`UploadsService` → `StorageService` (`@aws-sdk/client-s3`).

| Peça | Onde |
| --- | --- |
| Tipos aceitos, limites e pastas | `src/common/constants/upload.constants.ts` |
| Detecção por magic number, key do objeto, sanitização de nome | `src/common/utils/file-signature.util.ts` |
| Validador usado no `ParseFilePipe` | `src/common/validators/secure-file.validator.ts` |
| Cliente S3 (upload/remoção/URL pública) | `src/integrations/storage/storage.service.ts` |
| Rotas genéricas (`POST`/`DELETE /v1/uploads`) | `src/modules/uploads/` |

Regras:

- **Nunca confiar no `mimetype` nem no nome enviados pelo cliente.** O tipo é definido
  pela assinatura binária; o `Content-Type` e a extensão declarados só passam se baterem
  com o tipo detectado. Aceitos: PNG, JPEG, GIF, WEBP e PDF — **SVG é proibido**
  (XSS armazenado no domínio do bucket).
- A key é sempre `pasta/ano/mês/uuid.ext`, com `pasta` restrita a `UPLOAD_FOLDERS`. Nada
  vindo da requisição entra no caminho do objeto.
- Limite de 5 MB (`MAX_UPLOAD_FILE_SIZE_BYTES`), aplicado no `limits` do multer (corta o
  upload) e revalidado no `SecureFileValidator`.
- Objetos sobem com `ServerSideEncryption: AES256` e **sem ACL** — leitura pública vem de
  bucket policy/CloudFront, não de `public-read`.
- Módulos que precisam guardar arquivo usam o `UploadsService`, não o `StorageService`
  direto. Trocou a imagem de um registro? Remova a anterior com
  `storageService.removeByUrlSafely(urlAntiga)` (best-effort, nunca derruba o request).
- Sem `AWS_S3_BUCKET` configurado as rotas respondem **503 `storage-not-configured`**.
- Rotas que aceitam arquivo **e** JSON (ex: instituições) usam
  `@ApiConsumes('application/json', 'multipart/form-data')` e `fileIsRequired: false`.

Variáveis: `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_S3_PUBLIC_URL`, `AWS_S3_ENDPOINT`.

## E-mail transacional (Resend + React Email)

Substitui o `services/mail.js` do legado (nodemailer + SMTP do Gmail + Handlebars).

| Peça | Onde |
| --- | --- |
| Cliente Resend, montagem de URLs e render HTML/texto | `src/integrations/mail/mail.service.ts` |
| Templates (`.tsx`) e moldura compartilhada | `src/templates/mail/` |

Regras:

- **`send*` nunca lança.** E-mail é efeito colateral: o cadastro, a troca de senha e o
  webhook de pagamento não podem falhar porque o provedor está fora. O resultado volta em
  `SendMailResult` (`{ sent, id?, reason? }`) e o erro vai para o log.
- Sem `RESEND_API_KEY` (ou com `MAIL_ENABLED=false`) o serviço vira **no-op logado** — dev
  e homologação rodam sem credencial.
- Todo e-mail sai com HTML **e** texto puro, gerados do mesmo componente pelo `render()`.
- Templates novos: um arquivo `.tsx` em `src/templates/mail/`, exportando o componente,
  as props e a constante `<nome>Subject`; use a `EmailLayout` para header/rodapé. Estilos
  sempre **inline** (objetos JS) — cliente de e-mail ignora `<style>` e classes.
- Um método por e-mail no `MailService` (`sendNewUser`, `sendPasswordReset`,
  `sendPasswordResetConfirm`, `sendPaymentConfirmed`); quem chama não monta URL nem assunto.

E-mails existentes:

| Método | Dispara em |
| --- | --- |
| `sendNewUser` | `POST /v1/auth/register` |
| `sendPasswordReset` | `POST /v1/auth/forgot_password` |
| `sendPasswordResetConfirm` | `POST /v1/auth/password_reset` |
| `sendPaymentConfirmed` | webhook do Asaas, na **primeira** baixa do pagamento |
| `sendContact` | `POST /v1/contact` |

## Contato com o suporte (`src/modules/contact`)

`POST /v1/contact` — rota **pública** que encaminha a mensagem do usuário para a caixa do
suporte. Campos: `name`, `email`, `phone`, `subject`, `message` e `type` opcional
(`souAluno` | `queroSerAluno` | `souParceiro`).

- **Não existe `targetEmail` no payload.** O destino sai do `CONTACT_ROUTING` no
  `ContactService`, resolvido a partir do `type` via `ConfigService`. Aceitar o
  destinatário do cliente transformaria uma rota pública e sem autenticação em **relay
  aberto de e-mail**: qualquer um mandaria mensagem para qualquer endereço saindo do
  domínio da plataforma, queimando a reputação de envio e servindo de vetor de phishing.
  O `forbidNonWhitelisted` garante 400 se o campo vier.
- Caixa por origem com queda para a geral: `CONTACT_EMAIL_SOU_ALUNO`,
  `CONTACT_EMAIL_QUERO_SER_ALUNO`, `CONTACT_EMAIL_SOU_PARCEIRO` e `CONTACT_EMAIL_DEFAULT`.
- **Este é o único e-mail cuja falha vira erro HTTP** (503 `contact-not-delivered`, e
  `contact-not-configured` sem caixa). Nos demais o envio é efeito colateral e não pode
  derrubar a operação; aqui o e-mail **é** a operação — responder 200 faria o usuário
  acreditar que foi atendido enquanto a mensagem se perdeu no log.
- O `replyTo` é o e-mail de quem escreveu, não o `MAIL_REPLY_TO` padrão: o atendente
  responde e a resposta vai direto para a pessoa.
- `@Throttle({ ttl: 60s, limit: 5 })` — rota pública que dispara e-mail. Nos testes e2e,
  zere o `ThrottlerStorage` no `beforeEach`, senão os últimos casos recebem 429.

### JSX no build e nos testes

- `tsconfig.json` usa `"jsx": "react-jsx"`; os arquivos de template são `.tsx`.
- `tsconfig.build.json` exclui `scripts`, `prisma` e `prisma.config.ts` — se entrarem no
  build, o tsc sobe o `rootDir` para a raiz e a saída vira `dist/src/main.js`, quebrando o
  `start:prod` (`node dist/main`).
- O `@react-email/render` faz `import()` dinâmico internamente, o que o Jest em modo
  CommonJS não suporta. Por isso **todos os scripts de teste rodam
  `node --experimental-vm-modules node_modules/jest/bin/jest.js`** em vez de `jest` direto
  (funciona no Windows sem `cross-env`). Não voltar para `"test": "jest"`.
- `react` e `react-dom` precisam ficar na **mesma versão exata** — o render quebra em
  runtime com "Incompatible React versions".

## Cadastro público e recuperação de senha (`src/modules/auth`)

- `POST /v1/auth/register` — cadastro de aluno, público. Mora no AuthModule (e não no
  UsersController) porque aquele controller tem `JwtAuthGuard` no nível da classe.
  O `RegisterDto` (em `src/modules/users/dto/register.dto.ts`) **não tem** `type`,
  `institution_id` nem `partner_id`: quem entra pela rota pública é sempre `user`, e o
  vínculo com parceiro vem de `partner_code`, resolvido no servidor. Devolve o token já
  logado. Senha inicial = CPF (só números), como no legado.
- `POST /v1/auth/forgot_password` — resposta **sempre igual**, exista ou não a conta
  (o legado devolvia `user-not-found`, virando um verificador de e-mails cadastrados).
  Falha no envio também não muda a resposta: vira log de erro.
- `POST /v1/auth/password_reset` — token de uso único, validade de
  `PASSWORD_RESET_TOKEN_TTL_HOURS` (24h por padrão).
- O token vai por e-mail em texto puro, mas no banco fica só o **SHA-256** dele
  (`reset_password_token`). Vazamento da tabela não permite redefinir senha de ninguém.
- As três rotas usam `@Throttle({ ttl: 60s, limit: 5 })`.

## Migração do banco legado (`scripts/legacy-migration`)

Importação dos dados da API antiga (Sequelize/Express) para o schema novo. Documentação
completa em [scripts/legacy-migration/README.md](./scripts/legacy-migration/README.md).

- Conexões: `LEGACY_DATABASE_URL` (somente leitura, banco antigo) e `DATABASE_URL` (destino).
- Ids legados (`INTEGER`) viram cuid **determinístico** via `legacyId(entidade, idLegado)` —
  é o que torna a reexecução idempotente. Passos novos devem usar o mesmo helper.
- Cada entidade é um `MigrationStep` em `steps/`, registrado em `steps/index.ts`
  **na ordem das foreign keys**. Nomes de tabela e coluna do banco antigo são resolvidos por
  introspecção (`information_schema`) — nunca hard-coded.
- Toda linha descartada, renomeada ou com valor coagido precisa ser registrada no
  `MigrationReport` (é o que alimenta o relatório JSON de conferência).
- Alterou mapeamento? Rode `npm run db:migrate:legacy:smoke` (pipeline completo em memória,
  com asserções) e atualize as fixtures/verificações em `smoke-test.ts` na mesma entrega.

## Environment (`.env` — see `.env.example`)

`DATABASE_URL`, `PORT`, `ALLOWED_ORIGINS`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_BASE_URL`,
`LEGACY_DATABASE_URL` e `LEGACY_DATABASE_SSL` (apenas para a migração do banco legado),
`JOBS_ENABLED`, `JOBS_TIMEZONE` e as `ORDERS_RENEWAL_*` (tarefas agendadas),
`AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_S3_PUBLIC_URL` e `AWS_S3_ENDPOINT` (upload de arquivos),
`RESEND_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO`, `MAIL_ENABLED`, `APP_WEB_URL`,
`MAIL_LOGIN_PATH`, `MAIL_PASSWORD_RESET_PATH`, `MAIL_STUDENT_PORTAL_PATH` e
`PASSWORD_RESET_TOKEN_TTL_HOURS` (e-mail transacional e recuperação de senha).

## Related frontend

O web vive em `../web` (Next.js 16 / React 19), no mesmo monorepo, e consome esta API sob
o prefixo `/v1`. O contrato entre os dois é `@repo/contracts` (`packages/contracts`) —
mesmos schemas Zod, validando dos dois lados. Veja o [CLAUDE.md da raiz](../../CLAUDE.md).

## Referências

- Módulos e organização por feature seguem as recomendações oficiais do NestJS.
- Controllers e providers devem ser registrados no módulo e expostos via imports/exports.
- Middleware deve ser configurado usando `NestModule.configure()`.
