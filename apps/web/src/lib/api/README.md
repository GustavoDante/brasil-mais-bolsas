# Integração com a API

Camadas, de baixo para cima:

```
src/lib/api/         transporte  → fala HTTP com a API (DTOs crus, snake_case)
src/lib/mappers/     tradução    → DTO da API  ➜  modelo de UI (src/types)
src/data/            dados       → o que as páginas do site importam (mock ou API)
src/actions/         actions     → uma por rota do backend (ver src/actions/README.md)
```

Regra de ouro: **componente nunca importa `@/lib/api` nem `@/mocks`.** Componente importa
`@/data/...` (leitura das páginas do site, com cache e chave de mocks) e `@/actions/...`
(superfície completa da API: fluxos autenticados, backoffice e mutações). Assim a troca de
mock por API não toca em nenhuma tela.

## Ligar a API de verdade

```env
# .env.local
NEXT_PUBLIC_API_URL="http://localhost:3333"
NEXT_PUBLIC_USE_MOCKS="false"
NEXT_PUBLIC_IMAGES_BASE_URL="https://bucketbrasilmaisbolsas.s3.sa-east-1.amazonaws.com"
```

Com `NEXT_PUBLIC_USE_MOCKS="true"` (padrão) tudo em `src/data` responde com os mocks de
`src/mocks` — nenhuma requisição sai. É o estado atual do projeto.

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
timeout. Para exibir ao usuário use `toUserMessage(error)`, que já trata 401/403/404/429 e
aproveita o `userMessage` em português quando a API envia.

## Migrar uma página de mock para API

1. Trocar o import do mock pela função de `src/data`.
2. Se o componente for cliente e só precisar dos dados no primeiro render, buscar no
   Server Component pai e passar por props.
3. Rodar `npx tsx scripts/check-api-integration.ts` e conferir a forma dos dados.
4. Quando nenhuma página usar mais aquele mock, apagar o arquivo em `src/mocks`.

## Pontos em aberto (backend)

- `GET /v1/scholarships/:id` exige token, então o detalhe público é resolvido a partir da
  listagem (`getBolsaDetail` em `src/data/scholarships.data.ts`). Uma rota pública de
  detalhe simplificaria e deixaria a página mais leve.
- `list/order` não pagina: hoje devolve todas as bolsas ativas (~2,5 mil). A paginação
  ainda é feita no cliente.
- Conteúdo editorial do detalhe (galeria, mapa, texto institucional) não existe na API e
  segue com placeholders.
