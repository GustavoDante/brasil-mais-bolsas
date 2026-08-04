# CLAUDE.md — Brasil Mais Bolsas (Frontend)

Guidance for Claude Code when working in this repository. This file is the single
source of truth for project rules (there is no separate `AGENTS.md`).

> ⚠️ **This is NOT the Next.js you know.** This project pins **Next.js 16.2.6** and
> **React 19**, which have breaking changes vs. older training data. Before writing
> code that touches framework APIs, read the relevant guide under
> `node_modules/next/dist/docs/` and heed deprecation notices.

## Stack

- **Next.js 16.2.6** (App Router, Turbopack, React Server Components enabled)
- **React 19.2** + **TypeScript 5** (strict mode)
- **Tailwind CSS v4** — configured via CSS (`src/app/globals.css`), no `tailwind.config.js`
- **shadcn/ui** (`style: radix-nova`, `baseColor: neutral`) with **radix-ui** primitives
- **react-hook-form** + **zod v4** for forms/validation
- **lucide-react** icons, **embla-carousel-react** carousels, **cmdk** command menu

## Commands

Este app faz parte de um monorepo pnpm — veja o [CLAUDE.md da raiz](../../CLAUDE.md).
Rode sempre da **raiz do repositório**, nunca `npm` aqui dentro:

```bash
pnpm dev                    # sobe api + web
pnpm build                  # pacotes antes dos apps
pnpm --filter web run dev
pnpm --filter web run build
pnpm --filter web run lint
```

There is no test setup in this project. `pnpm --filter web run build` is the definitive
check — it runs a full TypeScript type check and fails on any type error. Mudou schema em
`@repo/contracts`? Rode `pnpm build` na raiz: os **dois** apps precisam compilar.

## Project structure

All application code lives under `src/`. Config files and `public/` stay at the root.

```
src/
  app/                      # App Router — routes, layouts, pages
    layout.tsx              # root layout (fonts, header/footer, metadata)
    globals.css             # Tailwind v4 entry + design tokens (CSS variables)
    (home)/                 # route group
      page.tsx
      _components/          # route-specific components (not shared)
  components/               # global shared components (site-header, site-footer)
    ui/                     # shadcn/ui primitives — imported via @/components/ui
  data/                     # camada de dados que as PÁGINAS consomem (mock ou API)
  actions/                  # uma action por rota da API, agrupadas por módulo
    _core/                  #   contrato de resultado/erro, validação zod, sessão
    <módulo>/               #   um arquivo por rota (ver actions/README.md)
    forms/                  #   adaptadores para useActionState
  lib/
    api/                    # cliente HTTP + recursos por domínio + DTOs (ver README.md)
    mappers/                # DTO da API → modelo de UI
    search-params.ts        # contrato da query string de /bolsas (filtros + paginação)
    seo.ts                  # siteConfig, absoluteUrl, truncateDescription
    structured-data.ts      # construtores de JSON-LD (schema.org)
    analytics.ts            # push de eventos para o dataLayer (GTM/GA)
    format.ts               # formatação pt-BR (moeda, turno, cidade)
    images.ts               # resolução de URL de imagem (S3 ou nome de arquivo legado)
    utils.ts                # helpers gerais (cn)
  types/                    # modelos de domínio usados pela UI
  hooks/                    # hooks de cliente (use-api-query, use-bolsas-query, ...)
  assets/                   # in-app SVG/icon components
  schemas/                  # zod schemas (form validation)
  mocks/                    # dados mockados, consumidos por src/data enquanto
                             #   NEXT_PUBLIC_USE_MOCKS != "false"
scripts/                    # utilitários fora do build (check-api-integration.ts)
public/                     # static assets (served at /)
```

## Conventions

- **Path alias:** `@/*` maps to `src/*` (see `tsconfig.json`). Always import via
  the alias (`@/components/...`, `@/lib/utils`), not deep relative paths.
- **Component placement:** shared → `src/components`; route-only → the route's
  `_components/` folder; shadcn primitives → `src/components/ui`.
- **Adding shadcn components:** use the CLI; `components.json` already points the
  `css` field at `src/app/globals.css` and aliases at `@/`.
- **TypeScript:** strict. Avoid `any`; prefer typed props and data models.
- **Styling / design tokens:** update the CSS variables in `src/app/globals.css`
  whenever design tokens change — do not hardcode colors in components.
- **zod v4:** the `error` param replaced `required_error`/`invalid_type_error`.
- **Mock data:** os dados mockados vivem em `src/mocks/<domain>.mock.ts` e são consumidos
  **pela camada de dados**, não pelas páginas. Os tipos ficam em `src/types` — o mock é só
  a fonte temporária. Quando uma rota passar a usar a API de verdade e nenhum `src/data`
  depender mais do arquivo, apague o mock.

## Integração com a API (obrigatório)

Documentação completa em [src/lib/api/README.md](./src/lib/api/README.md).

Camadas: `lib/api` (transporte/DTOs) → `lib/mappers` (DTO → modelo de UI) → `data`
(o que as páginas importam) → `actions` (mutações via Server Actions).

- **Componentes nunca importam `@/lib/api` nem `@/mocks`.** Leitura vem de `@/data/...`,
  escrita de `@/actions/...`. É isso que permite trocar mock por API sem tocar em telas.
- **Chave mock/API:** `NEXT_PUBLIC_USE_MOCKS` (padrão `"true"`). Cada função de `src/data`
  precisa ter os dois caminhos — mock e API — para a troca continuar sendo só uma variável.
- **Tipos:** os DTOs (snake_case) são **derivados de `@repo/contracts`** em
  `src/lib/api/dto/index.ts` — gerados do `schema.prisma`, nunca escritos à mão. Esse
  arquivo só dá a eles os nomes `*Dto` e monta o que existe só na resposta HTTP
  (relacionamentos incluídos, agregados, envelopes). Modelo da UI (camelCase) fica em
  `src/types`; a conversão acontece só nos mappers — nada de `snake_case` em componente.
- **Nunca importe `@repo/db` aqui.** Ele carrega o client do Prisma; no bundle do browser
  isso é vazamento de credencial e peso morto. O que o frontend precisa está em
  `@repo/contracts`, que depende só de `zod`.
- **Sessão:** token em cookie httpOnly; `@/lib/api/session` e `@/lib/api/server` são apenas
  servidor. Componente de cliente que precisa de dado autenticado passa por Server Action.
- **Erros:** o cliente HTTP sempre lança `ApiError` (inclusive rede/timeout). Para texto de
  interface use `toUserMessage(error)`.
- **Cache:** leituras públicas usam ISR com as tags de `cacheTags`; autenticadas e mutações
  são `no-store`. Depois de escrever, invalide com `revalidateTag`.
- **Ao alterar mapeamento ou adicionar recurso**, rode `npx tsx scripts/check-api-integration.ts`
  com a API no ar e confira a forma dos dados.

### Actions (uma por rota) — [actions/README.md](./src/actions/README.md)

- **Uma rota do backend = um arquivo em `src/actions/<módulo>/<rota>.action.ts`**, com
  `"use server"`, o schema zod da rota e uma única função assíncrona exportada. O módulo
  espelha o módulo da API. Rota nova na API ⇒ arquivo novo aqui + entrada no barrel.
- **Resultado padronizado:** `ActionResult<T>` = `{ ok: true, data, message? }` ou
  `{ ok: false, error: { code, message, status, fieldErrors? } }`. Action nunca lança para
  o cliente e nunca devolve o envelope cru da API (`{ ok, users }` etc.) — só o dado útil.
- **Erro padronizado:** `code` é o slug do backend (estável, use-o em `if`); `message` é
  pt-BR pronto para exibir. Traduções em `_core/action-error.ts`; código desconhecido cai
  em fallback por status e, por fim, em `unknown-error`. Texto técnico do backend nunca
  vai para a tela (fica em `details`).
- **Validação: o schema vem de `@repo/contracts`, não é escrito aqui.** É literalmente o
  mesmo objeto Zod que o NestJS usa para validar a requisição — não há mais "espelhar os
  decorators do backend".

  ```ts
  import { UpdateFaqSchema } from "@repo/contracts";
  // o id vai no path, então entra por composição:
  const schema = UpdateFaqSchema.extend({ id: zId("Informe o id da pergunta") });
  ```

  Precisa de campo novo? Edite o schema em `packages/contracts/src/<módulo>`, e os dois
  apps passam a exigi-lo. Só declare `z.object` local quando a entrada for exclusiva do
  frontend (path param de rota de leitura, filtro de tela) — nunca redeclarando um corpo
  de requisição que a API já define.
- Os blocos (`zEmail`, `zText`, `zId`…) continuam vindo de `@/actions/_core`, que agora só
  reexporta de `@repo/contracts`.
- **Sessão:** `auth: "required" | "optional" | "none"` no `executeAction` — nunca leia
  cookie dentro da action.
- **Mutação:** declare `revalidateTags` para invalidar o cache (o core chama `updateTag`).
- Ao mexer no núcleo, rode `npx tsx scripts/check-action-errors.ts`.

## Busca, filtros e query string

O estado dos filtros de `/bolsas` mora **na URL**, nunca em `useState`. Isso é o que
permite compartilhar/indexar uma busca e medir a busca no analytics sem instrumentação
extra. O contrato fica em [src/lib/search-params.ts](./src/lib/search-params.ts).

- **Parâmetros (pt-BR):** `curso`, `faculdade`, `cidade`, `modalidade` (lista separada por
  vírgula) e `pagina`. São públicos — mudar um nome quebra links e relatórios.
- **Sempre pelos helpers:** leia com `parseBolsasSearch` e escreva com `buildBolsasHref`.
  `buildBolsasHref` serializa em ordem fixa, omite vazios e omite `modalidade` quando
  todas estão marcadas — a mesma busca gera sempre a mesma URL.
- **A página é Server Component.** `page.tsx` lê `searchParams`, chama `@/data` e
  renderiza a lista no servidor. O formulário é cliente só para navegar
  (`router.push(buildBolsasHref(...))`); a **paginação é `<Link href>`**, nunca `onClick`.
- **Analytics:** `lib/analytics.ts` empurra eventos para `window.dataLayer` (no-op se não
  houver GTM). `bolsas_search` na submissão do formulário e `bolsas_results_view` a cada
  listagem exibida, com os mesmos campos da query string.

## SEO

- **`NEXT_PUBLIC_SITE_URL`** define a origem canônica (`lib/seo.ts` → `metadataBase`,
  canonical, `sitemap.xml`, `robots.txt`). Em produção precisa ser o domínio real.
- **Toda rota declara `alternates.canonical`.** Rotas dinâmicas usam `generateMetadata`;
  em `/bolsas/[slug]` o `getBolsaDetail` passa por `cache()` para não buscar duas vezes.
- **Navegação facetada:** uma faceta só (`?curso=Direito`) é indexável; combinação de
  filtros e `pagina > 1` recebem `robots: noindex, follow`. As facetas simples entram no
  `sitemap.ts`. Não bloqueie essas URLs no `robots.txt` — o robô precisa ler a diretiva.
- **Dados estruturados:** use os construtores de `lib/structured-data.ts` com o componente
  `<JsonLd />`; não escreva schema.org solto no JSX. Layout raiz emite `Organization` +
  `WebSite`; a listagem, `ItemList` + `BreadcrumbList`; o detalhe, `Course`/`Offer` +
  `BreadcrumbList` + `FAQPage`.
- **Uma única `<h1>` por página**, refletindo o conteúdo real (na listagem, a busca ativa).

## Related backend

A API vive em `../api` (NestJS), no mesmo monorepo. Expõe as rotas sob o prefixo `/v1` e
o Swagger em `/docs`. O contrato entre os dois é `@repo/contracts`
(`packages/contracts`) — mesmos schemas Zod, validando dos dois lados.
