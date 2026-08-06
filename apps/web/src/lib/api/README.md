# Integração com a API

Camadas, de baixo para cima:

```
src/lib/api/         transporte  → fala HTTP com a API (DTOs crus, snake_case)
src/lib/mappers/     tradução    → DTO da API  ➜  modelo de UI (src/types)
src/data/            dados       → o que as páginas do site importam
src/actions/         actions     → uma por rota do backend (ver src/actions/README.md)
```

Regra de ouro: **componente nunca importa `@/lib/api`.** Componente importa `@/data/...`
(leitura das páginas do site, com cache) e `@/actions/...` (superfície completa da API:
fluxos autenticados, backoffice e mutações). É essa fronteira que deixa trocar rota,
formato de DTO ou estratégia de cache sem tocar em nenhuma tela.

**Não existe mais chave de mocks.** `src/data` fala com a API sempre; sem `API_URL` no ar
a página quebra de propósito, em vez de mostrar dado inventado. Placeholders de arte
(logo, mapa, galeria) continuam em `public/placeholder` porque são campos que a API ainda
não tem — não são dados falsos, são o desenho ocupando o lugar.

## Ambiente

```env
# .env.local
NEXT_PUBLIC_API_URL="http://localhost:3333"
NEXT_PUBLIC_IMAGES_BASE_URL="https://bucketbrasilmaisbolsas.s3.sa-east-1.amazonaws.com"
```

O host de `NEXT_PUBLIC_IMAGES_BASE_URL` precisa estar em `images.remotePatterns`
(`next.config.ts`) — o `next/image` recusa host não declarado.

Para conferir a integração sem abrir o site (a API precisa estar rodando):

```bash
npx tsx scripts/check-api-integration.ts
```

## Leitura (Server Components)

```tsx
import { listBolsas } from "@/data/scholarships.data";

export default async function BolsasPage() {
  const bolsas = await listBolsas({ city: "Recife" });
  return <BolsasList bolsas={bolsas} />;
}
```

## Leitura sob interação (Client Components)

```tsx
"use client";
import { useApiQuery } from "@/hooks/use-api-query";
import { searchCities } from "@/data/catalog.data";

const { data, isLoading } = useApiQuery(() => searchCities(term), [term], {
  initialData: [],
  enabled: term.length >= 2,
  debounceMs: 300,
});
```

## Escrita e rotas autenticadas (actions)

Toda rota do backend tem uma action tipada em `src/actions/<módulo>` — contrato de
resultado e de erro documentados em [src/actions/README.md](../../actions/README.md).

```ts
import { updateUser } from "@/actions/users";

const result = await updateUser({ id, name: "Novo nome" });
if (!result.ok) console.error(result.error.code, result.error.message);
```

Em formulários, use os adaptadores de `@/actions/forms` com `useActionState`.

## Sessão

O access token fica num cookie `httpOnly` (`bmb.session`), escrito pela action `login`.

```tsx
import { getServerSession } from "@/lib/api/server";

const session = await getServerSession(); // { token, user } | null
```

`getServerSession` é memoizado por requisição. `@/lib/api/session` e `@/lib/api/server` são
**apenas servidor** — importar de um Client Component quebra o build de propósito.

## Cache

Chamadas públicas usam ISR (`NEXT_PUBLIC_API_REVALIDATE`, padrão 300s) com as tags de
`cacheTags`. Requisições autenticadas e mutações são sempre `no-store`. Para invalidar após
uma escrita:

```ts
import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/api";

revalidateTag(cacheTags.scholarships);
```

## Erros

Tudo que sai do cliente HTTP vira `ApiError` (`status`, `kind`, `body`), inclusive rede e
timeout. Para exibir ao usuário use `toUserMessage(error)`.

O corpo de erro da API é sempre
`{ ok: false, code, message, statusCode, timestamp, path, fieldErrors? }`, e a `message` já
vem em pt-BR pronta para a tela — o texto de cada erro é definido em
`packages/contracts/src/errors.ts`, do lado do `code`. `toUserMessage` só repassa; ele tem
texto próprio apenas para rede, timeout e resposta que não veio da nossa API (um 502 de
proxy, por exemplo). Não adicione tradução de código aqui.

## Ligar uma tela nova na API

1. Buscar no Server Component (`page.tsx` ou um componente de servidor) com uma função de
   `src/data` e passar o resultado por props.
2. Componente de cliente que precisa buscar depois de uma interação usa `useApiQuery` com
   a mesma função de `src/data` — nunca `fetch` solto nem `@/lib/api`.
3. Rodar `npx tsx scripts/check-api-integration.ts` e conferir a forma dos dados.

## Pontos em aberto (backend)

- `GET /v1/scholarships/:id` exige token, então o detalhe público é resolvido a partir da
  listagem (`getBolsaDetail` em `src/data/scholarships.data.ts`). Uma rota pública de
  detalhe simplificaria e deixaria a página mais leve.
- `list/order` não pagina: devolve todas as bolsas ativas de uma vez (~2,5 mil linhas,
  ~5 MB). Passa do limite de 2 MB por entrada do cache de fetch do Next, então **não fica
  em cache** — cada renderização do servidor baixa tudo de novo, e a paginação continua
  sendo feita no cliente. É o gargalo mais caro da integração hoje.
- `list/index` (vitrine da home) e `list/random` (destaques) não aceitam cidade, então o
  seletor de cidade da home leva para `/bolsas?cidade=...` em vez de refiltrar a vitrine.
- `category` existe como filtro em `list/order`, mas ainda não é parâmetro da query string
  pública de `/bolsas` — na home ele só entra como dimensão do analytics.
- Não há imagem por curso nem por categoria; os cards usam a arte de
  `public/placeholder`. Conteúdo editorial do detalhe (galeria, mapa, texto
  institucional) também não existe na API.
