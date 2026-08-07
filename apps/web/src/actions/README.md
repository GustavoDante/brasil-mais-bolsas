# Actions da API

Uma action por rota do backend, agrupadas por módulo — o mesmo recorte da API
(`src/modules/<módulo>` lá, `src/actions/<módulo>` aqui).

```
src/actions/
  _core/                  contrato compartilhado (resultado, erro, validação, sessão)
  <módulo>/
    <rota>.action.ts      uma rota = um arquivo = uma função exportada
    index.ts              barrel do módulo
  forms/                  adaptadores `(previousState, formData)` para useActionState
  index.ts                barrel geral
```

Importe pelo módulo (mantém o bundle enxuto):

```ts
import { getUser, updateUser } from "@/actions/users";
```

## Contrato de resposta

Toda action devolve o mesmo envelope — nunca lança para o cliente:

```ts
type ActionResult<TData> =
  | { ok: true; data: TData; message?: string }
  | { ok: false; error: { code: string; message: string; status: number; fieldErrors?: Record<string, string[]> } };
```

```tsx
const result = await updateUser({ id, name: "Novo nome" });

if (!result.ok) {
  // `code` para decidir comportamento, `message` para exibir
  if (result.error.code === "user-not-found") return notFound();
  toast.error(result.error.message);
  return;
}

console.log(result.data.name); // tipado como UserDto
```

Helpers em `@/actions/_core`: `isActionSuccess`, `isActionFailure`, `actionDataOr`,
`unwrapAction` (lança em Server Component, caindo no `error.tsx`) e `actionIdle`
(estado inicial de `useActionState`).

## Contrato de erro

`code` é um `ErrorCode` de `@repo/contracts` — união de literais, então comparar com um
código que não existe é erro de compilação. `message` é o texto em pt-BR **que a API
mandou**: o par (status, mensagem) de cada erro é definido uma vez, em
`packages/contracts/src/errors.ts`, e a resposta o carrega pronto.

O `AllExceptionsFilter` responde sempre
`{ ok: false, code, message, statusCode, timestamp, path, fieldErrors? }`, e
`_core/action-error.ts` só lê esses campos. **Não há tradução aqui.** Era o que existia
antes — um dicionário local espelhando os `throw` do backend — e os dois divergiram: 8
códigos da API sem entrada no web, 7 entradas no web sem ninguém que as lançasse.

Casos em que o texto é definido localmente — os únicos em que não existe resposta da API
para repassar:

| Situação | `code` | `message` |
| --- | --- | --- |
| Validação local (zod), antes de chamar a API | `validation-error` | "Confira os campos destacados." + `fieldErrors` |
| Sem sessão em rota `auth: "required"` | `not-authenticated` | "Faça login para continuar." (nem chama a API) |
| Falha de rede / timeout | `network-error` / `timeout-error` | mensagem própria |
| Exceção inesperada no próprio Next | `unknown-error` | mensagem padrão; o original fica em `details` |
| Resposta sem o nosso corpo (proxy, balanceador) | genérico do status | texto do catálogo para aquele status |

Erro novo na API ⇒ entrada em `packages/contracts/src/errors.ts`. Nada muda aqui: o código
e a mensagem chegam prontos, e o `ErrorCode` já reconhece o código novo nos dois apps.

Conferência (não precisa da API no ar):

```bash
npx tsx scripts/check-action-errors.ts
```

## Validação de entrada

Cada action valida a entrada com zod **antes** de qualquer rede. O schema não mora aqui:
fica em `src/schemas/<módulo>/<rota>.schema.ts`, um schema e um tipo por arquivo.

```ts
// src/schemas/faq/update-faq.schema.ts
import { UpdateFaqSchema, zId } from "@repo/contracts";

export const updateFaqInputSchema = UpdateFaqSchema.extend({
  id: zId("Informe o id da pergunta"),
});

export type UpdateFaqInput = z.infer<typeof updateFaqInputSchema>;
```

```ts
// src/actions/faq/update-faq.action.ts
import { updateFaqInputSchema } from "@/schemas/faq/update-faq.schema";

```

**Por que fora da action.** Um módulo `"use server"` só pode exportar função assíncrona, e
`@/actions/_core` arrasta `executeAction` → `@/lib/api/session` → `cookies()`. Um formulário
de cliente que importasse o schema de lá quebraria. Em `src/schemas` ele depende só de `zod`
e `@repo/contracts`, então o mesmo objeto serve ao `zodResolver` do react-hook-form:

```tsx
const form = useForm<UpdateFaqInput>({ resolver: zodResolver(updateFaqInputSchema) });
```

A tela passa a validar exatamente o que a action valida, que por sua vez valida exatamente
o que a API valida — a mesma cadeia, sem regra reescrita em nenhum ponto.

Os blocos (`zId`, `zEmail`, `zPassword`, `zOptionalText`, `zStringArray`…) e os schemas de
request vêm de `@repo/contracts`. **Nunca importe `@/actions/_core` num arquivo de schema.**

A action continua reexportando o tipo, então `import type { UpdateFaqInput } from
"@/actions/faq"` segue funcionando.

## Autenticação

`auth: "required"` resolve o token do cookie httpOnly e corta a chamada com
`not-authenticated` se não houver sessão. `auth: "optional"` envia o token quando existe.
`auth: "none"` é rota pública (login, contato, listagens do site).

`signIn` (em `auth/sign-in.action.ts`) é a action que **grava** a sessão; `login` apenas
devolve o token. `signOut` limpa o cookie.

## Cache

Mutações declaram `revalidateTags`; em caso de sucesso o `_core` chama `updateTag` (Next 16),
invalidando a tag e já entregando o dado novo na mesma resposta.

## Formulários

```tsx
"use client";
import { useActionState } from "react";
import { submitContactForm } from "@/actions/forms";
import { actionIdle } from "@/actions/_core";

const [state, formAction] = useActionState(submitContactForm, actionIdle);
<form action={formAction}>…</form>;
// !state.ok → state.error.message e state.error.fieldErrors
```

## Actions vs. camada de dados

- `src/data/*` → leitura das **páginas** do site, com cache e a chave de mocks.
- `src/actions/*` → superfície completa da API (137 rotas), tipada e validada, para
  fluxos autenticados, backoffice e mutações.

## Índice

Legenda: 🔒 exige sessão · ◐ envia o token se houver · sem marca = rota pública.

### `access` (3)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createAccess` | `POST /v1/access` | 🔒 | Registra um acesso para um parceiro. |
| `deleteAccess` | `DELETE /v1/access/:id` | 🔒 | Remove um acesso. |
| `listAccesses` | `GET /v1/access` | 🔒 | Lista os acessos registrados. |

### `addresses` (2)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createAddress` | `POST /v1/addresses` | ◐ | Cria um endereço avulso vinculado a um usuário. |
| `listAddresses` | `GET /v1/addresses` | ◐ | Lista os endereços cadastrados. |

### `auth` (5)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `getProfile` | `GET /v1/auth/me` | 🔒 | Perfil mínimo do token (id, e-mail e tipo). |
| `login` | `POST /v1/auth/login` |  | Autentica e devolve o token de acesso (a sessão é gravada por `signIn`). |
| `signIn` | `POST /v1/auth/login` |  | autentica e **grava a sessão** no cookie httpOnly. |
| `signInForm` | `POST /v1/auth/login` |  | autentica e **grava a sessão** no cookie httpOnly. |
| `signOut` | `POST /v1/auth/login` |  | autentica e **grava a sessão** no cookie httpOnly. |

### `calls` (6)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createCall` | `POST /v1/calls` | 🔒 | Registra uma ligação para um usuário. |
| `deleteCall` | `DELETE /v1/calls/:id` | 🔒 | Remove uma ligação. |
| `getCall` | `GET /v1/calls/id/:id` | 🔒 | Busca uma ligação pelo id. |
| `listCalls` | `GET /v1/calls` | 🔒 | Lista todas as ligações (admin). |
| `listMyCalls` | `GET /v1/calls/user` | 🔒 | Lista as ligações do usuário autenticado. |
| `updateCall` | `PATCH /v1/calls/:id` | 🔒 | Atualiza uma ligação. |

### `checkout` (1)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createCheckout` | `POST /v1/checkout` | 🔓 | Contrata a bolsa: cria a conta quando não há sessão (e grava o token) e gera a cobrança. |

> 🔓 = `auth: "optional"` — a mesma rota atende visitante e aluno logado.

### `contact` (1)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `submitContact` | `POST /v1/contact` |  | Envia uma mensagem do formulário de contato. |

### `course-categories` (7)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createCourseCategory` | `POST /v1/course-categories` | 🔒 | Cria uma categoria de curso (admin). |
| `deleteCourseCategory` | `DELETE /v1/course-categories/:id` | 🔒 | Remove uma categoria de curso (admin). |
| `getCourseCategoryByOldId` | `GET /v1/course-categories/old_id/:id` | 🔒 | Busca uma categoria pelo id do sistema antigo. |
| `getCourseCategory` | `GET /v1/course-categories/:id` | 🔒 | Busca uma categoria pelo id. |
| `listCourseCategories` | `GET /v1/course-categories` |  | Lista as categorias de curso. |
| `toggleCourseCategory` | `PATCH /v1/course-categories/:id/toggle` | 🔒 | Ativa/desativa uma categoria de curso (admin). |
| `updateCourseCategory` | `PUT /v1/course-categories/:id` | 🔒 | Atualiza uma categoria de curso (admin). |

### `courses` (9)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createCourse` | `POST /v1/courses` | 🔒 | Cria um curso (admin). |
| `deleteCourse` | `DELETE /v1/courses/:id` | 🔒 | Remove um curso (admin). |
| `getCourseByOldId` | `GET /v1/courses/old_id/:id` | 🔒 | Busca um curso pelo id do sistema antigo. |
| `getCourse` | `GET /v1/courses/id/:id` | 🔒 | Busca um curso pelo id. |
| `listCoursesByInstitution` | `GET /v1/courses/institution/:id` |  | Lista os cursos oferecidos por uma instituição. |
| `listCourses` | `GET /v1/courses` | 🔒 | Lista os cursos (admin vê todos; manager vê os da instituição). |
| `searchCourses` | `GET /v1/courses/search` | 🔒 | Busca cursos por nome. |
| `toggleCourse` | `PATCH /v1/courses/:id/toggle` | 🔒 | Ativa/desativa um curso (admin). |
| `updateCourse` | `PUT /v1/courses/:id` | 🔒 | Atualiza um curso (admin). |

### `external-clients` (3)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createExternalClient` | `POST /v1/external-clients` | 🔒 | Cria o cliente correspondente no gateway de pagamento. |
| `getExternalClient` | `GET /v1/external-clients/:id` | 🔒 | Busca um cliente do gateway pelo id. |
| `listExternalClients` | `GET /v1/external-clients` | 🔒 | Lista os clientes do gateway. |

### `faq` (5)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createFaq` | `POST /v1/faq` | 🔒 | Cria uma pergunta frequente (admin). |
| `deleteFaq` | `DELETE /v1/faq/:id` | 🔒 | Remove uma pergunta frequente (admin). |
| `getFaq` | `GET /v1/faq/:id` |  | Busca uma pergunta pelo id. |
| `listFaqs` | `GET /v1/faq` |  | Lista as perguntas frequentes. |
| `updateFaq` | `PUT /v1/faq/:id` | 🔒 | Atualiza uma pergunta frequente (admin). |

### `forms` (2)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `submitContactForm` | — |  |  |
| `createPossiblePartnerForm` | — |  |  |

### `indications` (5)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createIndicationCall` | `POST /v1/indications/call` | 🔒 | Registra uma ligação feita para uma indicação (admin). |
| `createIndication` | `POST /v1/indications` | 🔒 | Cria uma indicação em nome do usuário autenticado. |
| `deleteIndicationCall` | `DELETE /v1/indications/call/:id` | 🔒 | Remove uma ligação de indicação (admin). |
| `listIndications` | `GET /v1/indications` | 🔒 | Lista todas as indicações (admin). |
| `listMyIndications` | `GET /v1/indications/user` | 🔒 | Lista as indicações do usuário autenticado. |

### `institutions` (9)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createInstitution` | `POST /v1/institutions` | 🔒 | Cria uma instituição (admin). |
| `deleteInstitution` | `DELETE /v1/institutions/:id` | 🔒 | Remove uma instituição (admin). |
| `getInstitutionByOldId` | `GET /v1/institutions/old_id/:id` | 🔒 | Busca uma instituição pelo id do sistema antigo. |
| `getInstitution` | `GET /v1/institutions/id/:id` | 🔒 | Busca uma instituição pelo id. |
| `listInstitutions` | `GET /v1/institutions` | 🔒 | Lista as instituições (admin vê todas; manager vê a sua). |
| `searchInstitutionsByCity` | `GET /v1/institutions/search/by_city` | 🔒 | Busca instituições por cidade. |
| `searchInstitutions` | `GET /v1/institutions/search` | 🔒 | Busca instituições por nome. |
| `toggleInstitution` | `PATCH /v1/institutions/:id/toggle` | 🔒 | Ativa/desativa uma instituição (admin). |
| `updateInstitution` | `PUT /v1/institutions/:id` | 🔒 | Atualiza uma instituição (admin ou manager da instituição). |

### `jobs` (2)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `listScheduledJobs` | `GET /v1/jobs` | 🔒 | Lista as tarefas agendadas e a próxima execução (admin). |
| `runOrdersRenewal` | `POST /v1/jobs/orders-renewal/run` | 🔒 | Executa a renovação de pedidos agora e devolve o resumo (admin). |

### `minors` (2)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createMinor` | `POST /v1/minors` | 🔒 | Cadastra um dependente para um usuário. |
| `listMinors` | `GET /v1/minors` | 🔒 | Lista os dependentes cadastrados. |

### `notifications` (6)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createNotification` | `POST /v1/notifications` | 🔒 | Cria uma notificação para um usuário (admin). |
| `deleteNotification` | `DELETE /v1/notifications/:id` | 🔒 | Remove uma notificação. |
| `getNotification` | `GET /v1/notifications/:id` | 🔒 | Busca uma notificação pelo id. |
| `listNotifications` | `GET /v1/notifications` | 🔒 | Lista as notificações do usuário autenticado (admin vê todas). |
| `markNotificationAsRead` | `PATCH /v1/notifications/:id/read` | 🔒 | Marca uma notificação como lida. |
| `updateNotification` | `PATCH /v1/notifications/:id` | 🔒 | Atualiza uma notificação. |

### `orders` (8)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `changeOrderScholarship` | `PUT /v1/order/change` | 🔒 | Troca a bolsa de um pedido. |
| `createOrder` | `POST /v1/order` | 🔒 | Cria um pedido para uma bolsa. |
| `getOrderVoucher` | `GET /v1/order/voucher` | 🔒 | Busca o voucher do pedido de uma bolsa. |
| `getOrder` | `GET /v1/order/id/:id` | 🔒 | Busca um pedido pelo id. |
| `listExpiredOrders` | `GET /v1/order/expired` | 🔒 | Lista os pedidos expirados do usuário. |
| `listOrderPayments` | `GET /v1/order/payments` | 🔒 | Lista os pagamentos de um pedido. |
| `listOrders` | `GET /v1/order` | 🔒 | Lista pedidos com filtros e paginação. |
| `updateOrderDefaulter` | `POST /v1/order/update-defaulter` | 🔒 | Marca/desmarca um pedido como inadimplente (admin ou manager). |

### `partners` (8)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createPartner` | `POST /v1/partners` | 🔒 | Cria um parceiro (admin). |
| `deletePartner` | `DELETE /v1/partners/:id` | 🔒 | Remove um parceiro (admin). |
| `getPartner` | `GET /v1/partners/id/:id` | 🔒 | Busca um parceiro pelo id. |
| `listPartners` | `GET /v1/partners` | 🔒 | Lista os parceiros, opcionalmente filtrando acessos por período. |
| `loginPartner` | `POST /v1/partners/login` |  | Autentica um parceiro pelo código e senha. |
| `registerPartnerAccess` | `POST /v1/partners/access` |  | Registra o acesso de um visitante que chegou pelo código do parceiro. |
| `togglePartner` | `PATCH /v1/partners/:id/toggle` | 🔒 | Ativa/desativa um parceiro (admin). |
| `updatePartner` | `PUT /v1/partners/:id` | 🔒 | Atualiza um parceiro (admin). |

### `payments` (3)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createCreditCardPayment` | `POST /v1/payment/credit_card` | 🔒 | Cria um pagamento com cartão de crédito. |
| `createPixPayment` | `POST /v1/payment/asaas/pix` | 🔒 | Cria um pagamento via PIX e devolve o QR Code. |
| `getPayment` | `GET /v1/payment/:id` | 🔒 | Consulta um pagamento do próprio usuário (polling da confirmação). |

### `possible-partners` (5)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createPossiblePartnerCall` | `POST /v1/possible-partners/call` | 🔒 | Registra uma ligação para um possível parceiro (admin). |
| `createPossiblePartner` | `POST /v1/possible-partners` |  | Envia o formulário "quero ser parceiro". |
| `deletePossiblePartnerCall` | `DELETE /v1/possible-partners/call/:id` | 🔒 | Remove uma ligação de possível parceiro (admin). |
| `getPossiblePartner` | `GET /v1/possible-partners/id/:id` | 🔒 | Busca um possível parceiro pelo id (admin). |
| `listPossiblePartners` | `GET /v1/possible-partners` | 🔒 | Lista os possíveis parceiros (admin). |

### `reports` (8)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `getGeneralReport` | `GET /v1/reports/general` | 🔒 | Relatório geral de pagamentos por instituição, curso e período. |
| `getImpactReport` | `GET /v1/reports/impact` | 🔒 | Relatório de impacto (bolsas) de uma instituição. |
| `getPaymentsReport` | `GET /v1/reports/payments` | 🔒 | Relatório de pagamentos de um pedido. |
| `listCalledStudentsReport` | `GET /v1/reports/students/called` | 🔒 | Relatório de alunos já contatados. |
| `listDefaultersReport` | `GET /v1/reports/students/defaulters` | 🔒 | Relatório de alunos inadimplentes. |
| `listRenewalsReport` | `GET /v1/reports/students/renewals` | 🔒 | Relatório de renovações previstas para os próximos dias. |
| `listStudentsReport` | `GET /v1/reports/students` | 🔒 | Relatório de alunos. |
| `listStudentsToCallReport` | `GET /v1/reports/students/to_call` | 🔒 | Relatório de alunos a contatar. |

### `scholarships` (23)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `changeScholarshipOrder` | `POST /v1/scholarships/change` | 🔒 | Troca a bolsa de um pedido (admin). |
| `createScholarshipValue` | `POST /v1/scholarships/new_value` | 🔒 | Cria uma nova versão de valores para uma bolsa (admin). |
| `createScholarship` | `POST /v1/scholarships` | 🔒 | Cria uma bolsa (admin). |
| `deleteScholarship` | `DELETE /v1/scholarships/:id` | 🔒 | Remove uma bolsa (admin). |
| `getScholarshipByOldId` | `GET /v1/scholarships/old_id/:id` |  | Busca uma bolsa pelo id do sistema antigo. |
| `getScholarshipContract` | `GET /v1/scholarships/contract/:id` | 🔒 | Dados do contrato de uma bolsa para o usuário autenticado. |
| `getScholarshipRenewInfo` | `GET /v1/scholarships/renew/:id` | 🔒 | Dados de renovação de uma bolsa. |
| `getScholarshipStudentsCount` | `GET /v1/scholarships/students_count/:id` | 🔒 | Quantidade de alunos de uma bolsa. |
| `getScholarship` | `GET /v1/scholarships/:id` | 🔒 | Busca uma bolsa pelo id. |
| `listAllScholarships` | `GET /v1/scholarships/list/all` | 🔒 | Lista todas as bolsas com os filtros do backoffice. |
| `listBackofficeScholarships` | `GET /v1/scholarships/list/backoffice` | 🔒 | Lista as bolsas do backoffice com contagem de vendas. |
| `listScholarshipCoursesByCity` | `GET /v1/scholarships/list/course/bycity` |  | Lista cursos com bolsas em uma cidade e categoria. |
| `listIndexScholarships` | `GET /v1/scholarships/list/index` |  | Vitrine da home: por instituição, menor mensalidade e maior desconto. |
| `listInstitutionsByCity` | `GET /v1/scholarships/list/institution/bycity` |  | Lista instituições com bolsas em uma cidade e categoria. |
| `listOrderedScholarships` | `GET /v1/scholarships/list/order` |  | Bolsas ordenadas por categoria, com filtros do site. |
| `listRandomScholarships` | `GET /v1/scholarships/list/random` |  | Bolsas aleatórias para os destaques do site. |
| `listScholarshipCities` | `GET /v1/scholarships/list/city` |  | Lista todas as cidades com bolsas. |
| `listScholarships` | `GET /v1/scholarships` | 🔒 | Lista as bolsas do backoffice (admin/manager). |
| `searchScholarshipCities` | `GET /v1/scholarships/search/city` |  | Busca cidades que possuem bolsas ativas. |
| `searchScholarshipCourses` | `GET /v1/scholarships/search/course` |  | Busca cursos que possuem bolsas. |
| `searchScholarshipInstitutions` | `GET /v1/scholarships/search/institution` |  | Busca instituições que possuem bolsas. |
| `toggleScholarship` | `PATCH /v1/scholarships/:id/toggle` | 🔒 | Ativa/desativa uma bolsa (admin). |
| `updateScholarship` | `PUT /v1/scholarships/:id` | 🔒 | Atualiza uma bolsa (admin). |

### `sellers` (7)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createSeller` | `POST /v1/sellers` | 🔒 | Cria um vendedor (admin). |
| `deleteSeller` | `DELETE /v1/sellers/:id` | 🔒 | Remove um vendedor (admin). |
| `getSeller` | `GET /v1/sellers/id/:id` | 🔒 | Busca um vendedor pelo id. |
| `listSellers` | `GET /v1/sellers` | 🔒 | Lista os vendedores, opcionalmente filtrando por período. |
| `loginSeller` | `POST /v1/sellers/login` |  | Autentica um vendedor por e-mail e senha. |
| `toggleSeller` | `PATCH /v1/sellers/:id/toggle` | 🔒 | Ativa/desativa um vendedor (admin). |
| `updateSeller` | `PUT /v1/sellers/:id` | 🔒 | Atualiza um vendedor (admin). |

### `signed-contracts` (2)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createSignedContract` | `POST /v1/signed-contracts` | ◐ | Registra o aceite de contrato de uma bolsa. |
| `listSignedContracts` | `GET /v1/signed-contracts` | 🔒 | Lista os contratos assinados. |

### `user-identities` (2)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createUserIdentity` | `POST /v1/user-identities` | 🔒 | Vincula uma identidade externa (login social) a um usuário. |
| `listUserIdentities` | `GET /v1/user-identities` | 🔒 | Lista as identidades externas cadastradas. |

### `users` (8)

| Action | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `createUser` | `POST /v1/users` | 🔒 | Cria um usuário com endereço (admin). |
| `deleteUser` | `DELETE /v1/users/:id` | 🔒 | Remove um usuário (admin). |
| `getMe` | `GET /v1/users/me` | 🔒 | Dados completos do usuário autenticado. |
| `getUser` | `GET /v1/users/:id` | 🔒 | Busca um usuário pelo id. |
| `listUsers` | `GET /v1/users` | 🔒 | Lista os usuários (admin vê todos; manager vê os da instituição). |
| `toggleUser` | `PATCH /v1/users/:id/toggle` | 🔒 | Ativa/desativa um usuário (admin). |
| `updateMe` | `PUT /v1/users/me` | 🔒 | Atualiza os dados do usuário autenticado. |
| `updateUser` | `PUT /v1/users/:id` | 🔒 | Atualiza um usuário (admin), incluindo tipo e situação. |
