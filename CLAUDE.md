# CLAUDE.md — Brasil Mais Bolsas (monorepo)

Regras que valem para o repositório inteiro. Cada app mantém o seu próprio arquivo com as
regras específicas — **leia o do app antes de mexer nele**:

- [apps/api/CLAUDE.md](./apps/api/CLAUDE.md) — NestJS (módulos, testes, Swagger, jobs, uploads, e-mail)
- [apps/web/CLAUDE.md](./apps/web/CLAUDE.md) — Next.js (rotas, actions, SEO, integração com a API)

## Estrutura

```
apps/
  api/                 NestJS 11 — API REST sob o prefixo /v1, Swagger em /docs
  web/                 Next.js 16 (App Router, Turbopack)
packages/
  db/                  @repo/db        — Prisma: schema, migrations, client. SERVER-ONLY
  contracts/           @repo/contracts — contrato HTTP em Zod. ISOMÓRFICO (roda no browser)
  typescript-config/   @repo/typescript-config — bases de tsconfig
```

## Comandos (sempre da raiz, sempre `pnpm`)

```bash
pnpm install             # instala tudo; o pnpm resolve os links de workspace
pnpm dev                 # sobe api + web (turbo, persistent)
pnpm build               # pacotes antes dos apps (dependsOn ^build)
pnpm typecheck           # tipos nos 4 workspaces com código (inclui specs e scripts)
pnpm lint
pnpm test                # só `apps/api` tem suíte; o web é coberto pelo `next build`

pnpm db:generate         # client Prisma + schemas Zod de @repo/contracts, numa execução
pnpm db:migrate          # prisma migrate dev
pnpm db:deploy           # prisma migrate deploy (produção)
pnpm db:studio
pnpm db:seed
```

Para um workspace só: `pnpm --filter api run test:e2e`, `pnpm --filter web run build`,
`pnpm --filter @repo/db run typecheck`. Os filtros são `api`, `web`, `@repo/db`,
`@repo/contracts`.

**Nunca use `npm` ou `yarn` aqui.** O `packageManager` no `package.json` raiz fixa a versão
do pnpm; um `npm install` cria um `package-lock.json` paralelo e quebra os links de workspace.

## A regra central: uma fonte de verdade por tipo de informação

| Informação | Fonte | Consequência |
| --- | --- | --- |
| **Forma** das entidades (campos, nullability, defaults) | `packages/db/prisma/schema.prisma` | gerada, nunca escrita à mão |
| **Regras** de validação e formato do JSON | `packages/contracts/src/<módulo>` | escritas uma vez, usadas pelos dois apps |
| **Erros**: código, status HTTP e mensagem ao usuário | `packages/contracts/src/errors.ts` | a API resolve por ele, o web só exibe |
| Modelo de **apresentação** (texto formatado, pt-BR) | `apps/web/src/types` | só o web |

Um campo novo no `schema.prisma` chega nos dois apps por `pnpm db:generate`. Se você se
pegar redigitando um campo de banco em `apps/api` ou `apps/web`, parou de usar o contrato —
volte e componha a partir de `@repo/contracts`.

### `@repo/db` — persistência (server-only)

Exporta o `PrismaClient`, o namespace `Prisma`, os tipos de model, os enums e o
`createPrismaConnection()` (Pool + driver adapter — o Prisma 7 não tem mais engine embutida).

- **Nunca importe `@repo/db` de `apps/web`.** Ele carrega o client do Prisma; no bundle do
  browser isso é vazamento de credencial e peso morto.
- O client é **preguiçoso** (`getPrisma()`). Nada instancia Prisma no topo de módulo, senão
  todo import de tipo explodiria sem `DATABASE_URL` (build, teste, bundle).
- Migrations sempre por `pnpm db:migrate` — nunca escreva SQL à mão.

### `@repo/contracts` — o contrato da API (isomórfico)

Depende **só de `zod`**. Não pode importar `@repo/db`, `@prisma/client` nem API do Node —
esse é o critério que o mantém seguro no browser, e o `tsconfig` do pacote já força isso
com `"types": []`.

```
src/
  generated/     gerado do schema.prisma — NÃO EDITE, é sobrescrito por db:generate
  models.ts      os models gerados que fazem parte do contrato público
  enums.ts       enums de domínio (os *ScalarFieldEnum do Prisma ficam de fora)
  primitives.ts  blocos reutilizáveis (zEmail, zDocument, zState, zQueryInt, ...)
  common.ts      envelope { ok, ... } e helpers
  errors.ts      ERROR_CATALOG: código → status HTTP + mensagem em pt-BR
  <módulo>/      requests.ts + responses.ts de cada módulo da API
```

Regras:

- **Um módulo aqui = um módulo da API.** Rota nova ⇒ schema novo no módulo correspondente.
- Os schemas gerados descrevem só a **forma**. Regra de negócio (tamanho mínimo, formato de
  documento, campo obrigatório só nesta rota) vive na composição manual, com
  `.pick()` / `.omit()` / `.extend()` — nunca redeclarando o objeto inteiro.
- **Formato wire**: `Decimal` é `string` (`"1000.50"`) e `DateTime` é `string` ISO 8601. É
  o que a API realmente serializa em JSON. Não troque isso sem trocar os mappers do web.
- Use os blocos de `primitives.ts`. `z.string()` solto repetido em vários módulos é sinal de
  que falta um primitivo.
- Query string e path param usam os blocos `zQuery*`: tudo chega como string e precisa de
  coerção explícita.

**Erros (`errors.ts`).** O par (status HTTP, mensagem) de cada erro mora aqui. A API lança
`new AppException('user-not-found')` e o filtro global resolve os dois pelo catálogo; a
resposta é sempre `{ ok: false, code, message, statusCode, timestamp, path, fieldErrors? }`.

O frontend **não traduz código em mensagem** — exibe a `message` que veio na resposta. É
isso que faz um web mais antigo que a API continuar mostrando o texto certo. Do catálogo
ele importa só o tipo `ErrorCode`, para que comparar `error.code === '...'` seja checado
pelo compilador. Mensagem no service ou dicionário no web é justamente o que este arquivo
substituiu: os dois já tinham divergido, nas duas direções.

## Dependências: declare o que você importa

O pnpm não faz hoisting. Se um arquivo faz `import ... from 'x'`, `x` precisa estar no
`package.json` **daquele** workspace — não adianta ser dependência transitiva de outro
pacote. A migração já topou com isso em `pg`, `cron`, `ms` e `@prisma/client-runtime-utils`,
que funcionavam por acidente no npm.

Novas dependências: consulte o MCP do Context7 antes e pergunte antes de adicionar.

## Variáveis de ambiente

O `DATABASE_URL` é lido por uma cadeia de fallback em `packages/db/prisma.config.ts`
(`packages/db/.env` → `.env` da raiz → `apps/api/.env`), na ordem — o primeiro que tiver a
chave vence. Isso existe para o segredo não precisar ser duplicado: hoje ele mora em
`apps/api/.env` junto das variáveis de runtime, e os comandos `db:*` rodam a partir de
`packages/db`.

O resto fica em `apps/api/.env` (API) e `apps/web/.env.local` (web) — veja os
`.env.example` de cada app.

## Artefatos gerados (nunca versionados)

`packages/db/generated/` e `packages/contracts/src/generated/` saem do `pnpm db:generate`.
Se algum deles sumir, o build quebra com "cannot find module" — rode o generate, não crie
o arquivo à mão.

## Antes de considerar uma entrega pronta

```bash
pnpm db:generate && pnpm build && pnpm typecheck
pnpm --filter api run test && pnpm --filter api run test:e2e
```

O `next build` é o type-check definitivo do web (não há suíte de testes lá). Mudou schema
Zod compartilhado? Os dois apps precisam compilar — é justamente esse acoplamento
verificável que o monorepo existe para dar.

**`pnpm build` e `pnpm typecheck` não são redundantes.** O `nest build` compila pelo
`tsconfig.build.json`, que exclui `test/`, `scripts/` e `**/*spec.ts`; o `typecheck` da API
usa o `tsconfig.json`, que inclui os três. E o `ts-jest` não reprova por erro de tipo — uma
suíte verde não é prova de que os specs tipam. Sem os dois comandos, erro em spec ou em
script passa despercebido indefinidamente.
