# Migração de dados — API legada (Sequelize) → API nova (Prisma)

Script que lê o banco da API antiga (`brasilmaisbolsas-api-main`, Sequelize/Express) e grava
os dados no banco da API nova (NestJS + Prisma), aplicando as transformações necessárias
entre os dois schemas.

```bash
npm run db:migrate:legacy:smoke   # valida o pipeline em memória (sem banco)
npm run db:migrate:legacy:dry     # lê o banco antigo e simula, sem gravar nada
npm run db:migrate:legacy         # executa a migração de verdade
```

## Pré-requisitos

1. Banco novo já criado e migrado:

```bash
npx prisma migrate deploy
```

2. Variáveis no `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/bmb?schema=public"
LEGACY_DATABASE_URL="postgresql://usuario:senha@host-antigo:5432/base_antiga"
LEGACY_DATABASE_SSL="true"   # opcional; padrão true para host remoto, false para localhost
```

> Recomendado apontar `LEGACY_DATABASE_URL` para uma **restauração local do dump** de
> produção. O script só executa `SELECT` no banco antigo, mas rodar contra produção
> adiciona carga desnecessária.

## Opções

| Opção | Efeito |
| --- | --- |
| `--dry-run` | Lê e transforma tudo, mas não grava. Gera o relatório completo. |
| `--only=users,orders` | Roda apenas os passos informados. |
| `--skip=faqs` | Pula os passos informados. |
| `--limit=100` | Processa no máximo N linhas por passo (teste rápido). |
| `--batch-size=500` | Linhas por statement (padrão 500). |
| `--on-conflict=skip` | Padrão: ignora registros que já existem no banco novo. |
| `--on-conflict=update` | Faz `upsert` — reexecutar atualiza os dados já migrados. |
| `--reset --confirm` | **Apaga todos os dados do banco novo** antes de importar. Bloqueado com `NODE_ENV=production`. |
| `--report=caminho.json` | Onde salvar o relatório (padrão `scripts/legacy-migration/reports/`). |
| `--list` | Lista os passos disponíveis. |

## Ordem de execução e mapeamento

A ordem respeita as foreign keys reais do schema novo (o antigo usava
`constraints: false` em todas as associações, então referências órfãs são esperadas).

| # | Passo | Tabela legada | Modelo novo |
| --- | --- | --- | --- |
| 1 | `sellers` | `sellers` | `Seller` |
| 2 | `partners` | `partners` | `Partner` |
| 3 | `accesses` | `accesses` | `Access` |
| 4 | `institutions` | `institutions` | `Institution` |
| 5 | `course-categories` | `course_categories` | `CourseCategory` |
| 6 | `courses` | `courses` | `Course` |
| 7 | `scholarships` | `scholarships` | `Scholarship` |
| 8 | `users` | `users` | `User` |
| 9 | `addresses` | `addresses` | `Address` |
| 10 | `minors` | `users` (colunas `minor_*`) | `Minor` |
| 11 | `external-clients` | `clients` | `ExternalClient` |
| 12 | `orders` | `orders` | `Order` |
| 13 | `payments` | `payments` | `Payment` |
| 14 | `signed-contracts` | `signed_contracts` | `SignedContract` |
| 15 | `indications` | `indications` | `Indication` |
| 16 | `indication-calls` | `call_indications` | `IndicationCall` |
| 17 | `calls` | `calls` | `Call` |
| 18 | `notifications` | `notifications` | `Notification` |
| 19 | `possible-partners` | `possible_partners` | `PossiblePartner` |
| 20 | `possible-partner-calls` | `call_possible_partners` | `PossiblePartnerCall` |
| 21 | `faqs` | `faqs` | `Faq` |

`UserIdentity` não tem equivalente no legado (login social é recurso novo) e não é migrada.

O nome real de cada tabela e coluna é resolvido por **introspecção** (`information_schema`),
porque o projeto antigo misturava `sequelize.sync()` com migrations escritas à mão — daí
existirem variações como `users`/`Users`, `created_at`/`createdAt`, `deviceInfo`/`device_info`.
Se uma tabela não existir no banco de origem, o passo é marcado como `no-source` e a
migração continua.

## Transformações aplicadas

### IDs (inteiro → cuid)

O banco antigo usa `INTEGER AUTO_INCREMENT`; o novo usa `String @id @default(cuid())`.
Cada id novo é derivado deterministicamente do legado:

```
id = "c" + base36(sha256("<entidade>:<id_legado>")).slice(0, 24)
```

Isso permite resolver foreign keys sem tabela de tradução, reexecutar a migração sem
duplicar registros e reencontrar qualquer registro a partir do id antigo.
`ExternalClient` é a exceção: mantém o id original (id do cliente no gateway de pagamento).

### Enums (string livre → enum do Postgres)

| Campo | Legado | Novo |
| --- | --- | --- |
| `Course.duration_type` | `days` / `months` / `years` | `DAYS` / `MONTHS` / `YEARS` (desconhecido → `MONTHS`) |
| `Scholarship.type` | `presencial` / `semi-presencial` / `semipresencial` / `ead` | `PRESENCIAL` / `SEMI_PRESENCIAL` / `EAD` (desconhecido → `PRESENCIAL`) |
| `Payment.payment_type` | `boleto`, `BOLETO`, `credit_card`, `PIX`, `interest`, `refunded`, `CANCELLED`… | `BOLETO`, `CREDIT_CARD`, `PIX`, `INTEREST`, `REFUNDED`, `CANCELLED` (nulo continua nulo, desconhecido → `UNDEFINED`) |
| `ExternalClient.personType` | `FISICA` / `JURIDICA` | idem; se vazio, é inferido pelo tamanho do CPF/CNPJ |

`Payment.status` continua string livre, apenas normalizado para maiúsculas (`paid` → `PAID`).

### Números

`FLOAT` → `DECIMAL(12,2)`: valores são arredondados para 2 casas e enviados como string
(`900.456` → `"900.46"`). `quantity_offered` e `renovation_days` eram `FLOAT` e viram `Int`.

### Constraints UNIQUE que não existiam no legado

| Constraint nova | Tratamento |
| --- | --- |
| `User.email` | Vence o registro não deletado / ativo / mais recente; os demais recebem `local+legacy<id>@dominio`. E-mail vazio vira `legacy-user-<id>@migrado.brasilmaisbolsas.local`. Todos os e-mails são normalizados para minúsculas. |
| `Partner.code` | Primeiro registro mantém o código; duplicados viram `<code>-legacy<id>`. |
| `Order.code` | Primeiro registro mantém o código; duplicados/nulos recebem o próximo número livre acima do maior código existente. |
| `Address.user_id` | Mantém apenas o endereço mais recente de cada usuário. |
| `Indication (email, cell)` | Mantém a indicação mais antiga não deletada; as duplicadas são descartadas e **suas ligações são reapontadas para a mantida**. |
| `ExternalClient.externalReference` | Mantém apenas o cliente mais recente de cada usuário. |

### Foreign keys órfãs

No schema novo as FKs são reais e usam `onDelete: Restrict`. Referências que apontam para
registros inexistentes são tratadas assim:

- **FK obrigatória** (ex.: `Payment.order_id`, `Order.user_id`, `Scholarship.course_id`):
  a linha é **descartada** e registrada no relatório. O descarte é em cascata — pagamentos de
  um pedido descartado também são descartados.
- **FK opcional** (ex.: `User.partner_id`, `User.institution_id`, `Call.receiver_id`):
  o campo vira `null`.
- **`Institution.seller_id`** é obrigatório no schema novo mas era opcional no antigo:
  instituições sem vendedor são ligadas a um vendedor placeholder
  (`Sem vendedor (migração legado)`, criado inativo).
- **`Course.category_id`** órfão usa a categoria placeholder `Sem categoria (migração legado)`.

### Campos obrigatórios sem valor no legado

O schema novo tornou vários campos `NOT NULL`. Quando o legado não tem valor:

- Texto → string vazia (`""`) — nada é inventado, e a ocorrência aparece no relatório
  como `campo-obrigatorio-vazio:<campo>`.
- Data → `1900-01-01` (data sentinela, fácil de localizar depois).
- Decimal → `0.00`.
- `Scholarship.register_period_start` → usa o `created_at` da bolsa.

### Mudanças estruturais

- **`Minor`**: o legado cravava **um único** dependente dentro da linha do usuário
  (`has_dependent`, `minor_name`, `minor_birthdate`); agora existe uma tabela própria que
  aceita **N** dependentes por usuário. Regra aplicada:
  - tem `minor_name` → vira um registro em `Minor` (o id determinístico usa o "slot"
    `minor:user-<id>`, então reexecutar não duplica; dependentes adicionais passam a ser
    criados normalmente pela API);
  - `has_dependent = true` sem nome → nada a migrar, apenas reportado;
  - só `minor_birthdate` residual, sem nome → **não** vira dependente (o campo `name` é
    obrigatório e uma data solta não representa uma pessoa), reportado como
    `minor_birthdate-residual-sem-nome`;
  - nome preenchido com `has_dependent = false` → migrado assim mesmo (é dado real digitado
    pelo usuário) e reportado como `has_dependent-false-com-nome-migrado` para conferência.
- **`IndicationCall` / `PossiblePartnerCall`**: no legado, `receiver_id` **não** era um
  usuário — a associação era `Indications.hasMany(CallIndications, { foreignKey: 'receiver_id' })`,
  ou seja, apontava para a indicação (o mesmo vale para `CallPossiblePartner`). O script usa
  `receiver_id` como `indication_id` / `possible_partner_id`, mantém `caller_id` como usuário
  e deixa o novo `receiver_id` (usuário) nulo.
- **Senhas**: os hashes de `User.password` vêm do `bcryptjs` e são compatíveis com o pacote
  `bcrypt` usado na API nova — são copiados sem alteração. `Seller.password` e
  `Partner.password` continuam sendo copiados como estão (o legado e a API nova tratam esses
  campos da mesma forma).
- **Timestamps**: `created_at` / `updated_at` originais são preservados.

## Reexecução

Como os ids são determinísticos, rodar de novo é seguro:

- `--on-conflict=skip` (padrão): registros já migrados são ignorados; só entra o que é novo.
- `--on-conflict=update`: registros existentes são atualizados com o estado atual do legado.

Para migrar apenas um domínio depois de um ajuste:

```bash
npm run db:migrate:legacy -- --only=payments --on-conflict=update
```

## Relatório

Cada execução imprime um resumo (lidos / gravados / pulados / ajustes / erros por passo) e
salva um JSON em `scripts/legacy-migration/reports/migration-<timestamp>.json` com:

- estatísticas por passo;
- contagem de todas as ocorrências agrupadas por motivo;
- até 200 exemplos por motivo, com o id legado de cada registro afetado.

Use esse arquivo para revisar o que foi descartado antes de considerar a migração concluída.
Para listar os descartes agrupados por motivo:

```bash
node -e "const r=require('./scripts/legacy-migration/reports/<arquivo>.json');const g={};for(const s of r.samples.filter(s=>s.kind==='skipped'))(g[s.step+' :: '+s.reason]??=[]).push(s.legacyId);for(const[k,v]of Object.entries(g))console.log(k,'->',v.join(', '))"
```

## Roteiro sugerido

```bash
npm run db:migrate:legacy:smoke                      # 1. valida o pipeline
npm run db:migrate:legacy -- --dry-run --limit=200   # 2. amostra do banco real, sem gravar
npm run db:migrate:legacy -- --dry-run               # 3. simulação completa; revisar relatório
npm run db:migrate:legacy                            # 4. migração real
npx ts-node scripts/legacy-migration/verify.ts       # 5. conferência via Prisma
```

Conferência rápida depois de rodar:

```sql
SELECT 'users' AS tabela, COUNT(*) FROM "User"
UNION ALL SELECT 'orders', COUNT(*) FROM "Order"
UNION ALL SELECT 'payments', COUNT(*) FROM "Payment"
UNION ALL SELECT 'scholarships', COUNT(*) FROM "Scholarship";

-- registros que precisam de curadoria manual
SELECT id, name, email FROM "User" WHERE email LIKE '%@migrado.brasilmaisbolsas.local';
SELECT id, name FROM "User" WHERE birthdate = '1900-01-01';
SELECT id, name FROM "Seller" WHERE name LIKE 'Sem vendedor%';
```

## Estrutura do código

```
scripts/legacy-migration/
  migrate.ts            # CLI: configuração, conexões, reset, execução, relatório
  smoke-test.ts         # pipeline completo em memória, com asserções (sem banco)
  verify.ts             # conferência pós-migração lendo pelo Prisma (relações completas)
  lib/
    config.ts           # variáveis de ambiente + flags de linha de comando
    legacy-db.ts        # acesso somente leitura ao banco antigo + introspecção
    ids.ts              # id determinístico (int → cuid) e registro de ids existentes
    transforms.ts       # coerção de tipos, enums, decimais, e-mails
    context.ts          # contexto compartilhado + gravação em lote (BatchWriter)
    runner.ts           # execução dos passos
    report.ts           # estatísticas, ocorrências e relatório JSON
  steps/
    catalog.step.ts     # sellers, partners, accesses, institutions, categorias, cursos, bolsas
    people.step.ts      # users, addresses, minors, external clients
    commerce.step.ts    # orders, payments, signed contracts
    crm.step.ts         # indicações, possíveis parceiros, ligações, notificações, faq
```

## Limitações conhecidas

- `UserIdentity` não é migrada (não existe no legado).
- Arquivos/imagens (ex.: `Institution.image`) são migrados como string; nenhum objeto do S3
  é copiado.
- O script não desativa nem altera o banco antigo — a virada de tráfego é decisão manual.
