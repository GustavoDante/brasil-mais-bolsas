# Matriz de Cobertura E2E — 88 Endpoints

Este documento mapeia todos os endpoints da API com os status codes testados. Status codes marcados com ✅ foram testados; ✗ indica gaps de cobertura.

**Total de endpoints**: 88  
**Total de testes atual**: 283  
**Cobertura por endpoint**: ~85% (cenários principais cobertos)

---

## Auth Module (2 endpoints)

| Endpoint                      | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ----------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| POST /v1/auth/login           | POST   | ✅      | ✗   | ✅  | —   | ✅  | 5      |
| GET /v1/auth/me               | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| POST /v1/auth/register        | POST   | ✅      | ✅  | —   | —   | —   | 5      |
| POST /v1/auth/forgot_password | POST   | ✅      | ✅  | —   | —   | —   | 3      |
| POST /v1/auth/password_reset  | POST   | ✅      | ✅  | —   | —   | —   | 4      |

**Cenários testados**:

- login com credenciais válidas (201)
- login com credenciais inválidas (401)
- login com email inválido (401)
- login com campo extra ignorado (201)
- login com throttle/rate limit (429)
- GET /me sem token (401)
- GET /me com token válido (200)

- cadastro público válido (201), sem endereço / e-mail inválido / CPF fora do tamanho (400)
- cadastro tentando enviar `type: admin` — rejeitado pelo `forbidNonWhitelisted` (400)
- forgot_password com e-mail cadastrado e inexistente devolvendo **a mesma resposta** (200)
- password_reset com token e senhas válidos (200), senha curta / sem token / token
  recusado pelo service (400)

**Gaps**:

- login com payload vazio (400)
- login com password muito curta (400)

---

## Users Module (8 endpoints)

| Endpoint                   | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| -------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| GET /v1/users              | GET    | ✅      | —   | ✅  | ✅  | —   | 3      |
| GET /v1/users/me           | GET    | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/users/:id          | GET    | ✅      | —   | —   | ✅  | —   | 2      |
| POST /v1/users             | POST   | ✅      | ✅  | ✅  | ✅  | —   | 8      |
| PUT /v1/users/me           | PUT    | ✅      | —   | —   | —   | —   | 1      |
| PUT /v1/users/:id          | PUT    | ✅      | —   | —   | ✅  | —   | 2      |
| PATCH /v1/users/:id/toggle | PATCH  | ✅      | —   | ✅  | ✅  | —   | 4      |
| DELETE /v1/users/:id       | DELETE | ✅      | —   | —   | ✅  | —   | 2      |

**Cenários testados**:

- GET /users sem token (401), com manager (403), com admin (200)
- GET /me com token (200, contém dados do usuário logado)
- GET /:id com user comun acessando outro (403), com admin (200)
- POST sem token (401), com payload inválido (400)
- PUT /me com token (200)
- PUT /:id com manager (403), com admin (200)
- DELETE /:id com manager (403), com admin (200)

**Gaps**:

Nenhum identificado para rotas principais

---

## Courses Module (9 endpoints)

| Endpoint                        | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| GET /v1/courses                 | GET    | ✅      | —   | ✅  | —   | —   | 3      |
| GET /v1/courses/institution/:id | GET    | ✅      | —   | —   | —   | —   | 2      |
| GET /v1/courses/search          | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/courses/id/:id          | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/courses/old_id/:id      | GET    | ✗       | —   | ✅  | —   | —   | 1      |
| POST /v1/courses                | POST   | ✅      | —   | ✅  | ✅  | —   | 3      |
| PUT /v1/courses/:id             | PUT    | ✅      | —   | —   | ✅  | —   | 2      |
| DELETE /v1/courses/:id          | DELETE | ✅      | —   | —   | ✅  | —   | 2      |
| PATCH /v1/courses/:id/toggle    | PATCH  | ✅      | —   | —   | ✅  | —   | 2      |

**Cenários testados**:

- GET /courses sem token (401), com manager (200), com admin (200)
- GET /institution/:id público (200)
- GET /search sem token (401), com token (200)
- GET /id/:id sem token (401), com token (200)
- POST sem token (401), com manager (403), com admin (201)
- PUT e DELETE com manager (403), com admin (200)
- PATCH toggle com manager (403), com admin (200)

**Gaps**:

- GET /old_id/:id sucesso (200)

---

## Course Categories Module (7 endpoints)

| Endpoint                               | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| -------------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| GET /v1/course-categories              | GET    | ✅      | —   | —   | —   | —   | 2      |
| GET /v1/course-categories/:id          | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/course-categories/old_id/:id   | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| POST /v1/course-categories             | POST   | ✅      | —   | ✅  | ✅  | —   | 3      |
| PUT /v1/course-categories/:id          | PUT    | ✅      | —   | —   | ✅  | —   | 2      |
| DELETE /v1/course-categories/:id       | DELETE | ✅      | —   | —   | ✅  | —   | 2      |
| PATCH /v1/course-categories/:id/toggle | PATCH  | ✅      | —   | —   | ✅  | —   | 2      |

**Cenários testados**:

- GET / público (200)
- GET /:id sem token (401), com token (200)
- GET /old_id/:id sem token (401), com token (200)
- POST sem token (401), com manager (403), com admin (201)
- PUT, DELETE, PATCH toggle com manager (403), com admin (200)

**Gaps**: Nenhum identificado para rotas principais

---

## Institutions Module (9 endpoints)

| Endpoint                            | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ----------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| GET /v1/institutions                | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/institutions/search         | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/institutions/search/by_city | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/institutions/id/:id         | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/institutions/old_id/:id     | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| POST /v1/institutions               | POST   | ✅      | —   | ✅  | ✅  | —   | 3      |
| PUT /v1/institutions/:id            | PUT    | ✅      | —   | —   | ✅  | —   | 2      |
| DELETE /v1/institutions/:id         | DELETE | ✅      | —   | —   | ✅  | —   | 2      |
| PATCH /v1/institutions/:id/toggle   | PATCH  | ✅      | —   | —   | ✅  | —   | 2      |

**Cenários testados**:

- GET / sem token (401), com token (200)
- GET /search com token (200)
- GET /search/by_city sem token (401), com token (200)
- GET /id/:id e /old_id/:id sem token (401), com token (200)
- POST sem token (401), com manager (403), com admin (201)
- PUT, DELETE, PATCH toggle com manager (403), com admin (200)

**Gaps**: Nenhum identificado para rotas principais

---

## Scholarships Module (24 endpoints)

| Endpoint                                | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| --------------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| GET /v1/scholarships/search/city        | GET    | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/scholarships/list/city          | GET    | ✅      | —   | —   | —   | —   | 2      |
| GET /v1/scholarships                    | GET    | ✅      | —   | ✅  | —   | —   | 3      |
| GET /v1/scholarships/list/index         | GET    | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/scholarships/list/random        | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/scholarships/list/all           | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/scholarships/list/backoffice    | GET    | ✅      | —   | ✅  | ✅  | —   | 3      |
| GET /v1/scholarships/search/institution | GET    | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/scholarships/search/course      | GET    | ✅      | —   | —   | —   | —   | 1      |
| POST /v1/scholarships                   | POST   | ✅      | —   | ✅  | ✅  | —   | 3      |
| GET /v1/scholarships/students_count/:id | GET    | ✅      | —   | ✅  | ✅  | —   | 4      |
| GET /v1/scholarships/:id                | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/scholarships/old_id/:id         | GET    | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/scholarships/contract/:id       | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| GET /v1/scholarships/renew/:id          | GET    | ✅      | —   | ✅  | —   | —   | 2      |
| POST /v1/scholarships/change            | POST   | ✅      | ✅  | ✅  | ✅  | —   | 5      |
| POST /v1/scholarships/new_value         | POST   | ✅      | ✅  | ✅  | ✅  | —   | 5      |
| PUT /v1/scholarships/:id                | PUT    | ✅      | ✅  | ✅  | ✅  | —   | 5      |
| DELETE /v1/scholarships/:id             | DELETE | ✅      | —   | —   | ✅  | —   | 2      |
| PATCH /v1/scholarships/:id/toggle       | PATCH  | ✅      | —   | —   | ✅  | —   | 2      |

**Cenários testados**:

- GET /search/city público (200)
- GET /list/city público (200)
- GET / sem token (401), com manager (200), com admin (200)
- GET /list/index público (200)
- GET /list/random sem token (401), com token (200)
- GET /list/all sem token (401), com token (200)
- GET /list/backoffice sem token (401), com user (403), com manager (200)
- GET /search/\* públicos (200)
- POST sem token (401), com manager (403), com admin (201)
- GET /students_count/:id sem token (401), com user (403), com manager (403), com admin (200)
- GET /:id sem token (401), com token (200)
- GET /old_id/:id público (200)
- GET /contract/:id e /renew/:id sem token (401), com token (200)
- POST /change sem token (401)
- POST /new_value sem token (401)
- PUT /:id sem token (401), com manager (403)
- DELETE e PATCH toggle com manager (403), com admin (200)

**Gaps**:

Nenhum identificado para rotas principais

---

## Payments Module (4 endpoints)

| Endpoint                                 | Metodo | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ---------------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| POST /v1/payment/credit_card             | POST   | ok      | ok  | ok  | -   | -   | 4      |
| POST /v1/payment/create-interest-payment | POST   | ok      | -   | -   | -   | -   | 1      |
| POST /v1/payment/asaas/pix               | POST   | ok      | -   | -   | -   | -   | 1      |
| POST /v1/payment/asaas/webhook           | POST   | ok      | -   | ok  | -   | -   | 2      |

**Cenarios testados**:

- Cartao com sucesso, sem token, payload invalido e campo extra
- Interest payment com sucesso
- PIX Asaas com sucesso
- Webhook Asaas com token valido e token invalido

---

## Orders Module (8 endpoints)

| Endpoint                        | Metodo | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| POST /v1/order                  | POST   | ok      | ok  | ok  | ok  | -   | 4      |
| GET /v1/order                   | GET    | ok      | -   | -   | -   | -   | 1      |
| GET /v1/order/id/:id            | GET    | ok      | -   | -   | -   | -   | 1      |
| PUT /v1/order/change            | PUT    | ok      | -   | -   | -   | -   | 1      |
| POST /v1/order/update-defaulter | POST   | ok      | -   | -   | -   | -   | 1      |
| GET /v1/order/voucher           | GET    | ok      | -   | -   | -   | -   | 1      |
| GET /v1/order/payments          | GET    | ok      | -   | -   | -   | -   | 1      |
| GET /v1/order/expired           | GET    | ok      | -   | -   | -   | -   | 1      |

**Cenarios testados**:

- Criacao manual com admin, sem token, usuario comum e payload invalido
- Listagem, busca por id, troca de bolsa, inadimplencia, voucher, pagamentos e expirados

---

## Possible Partners Module (5 endpoints)

| Endpoint                              | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ------------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| POST /v1/possible-partners            | POST   | ✅      | ✅  | —   | —   | —   | 2      |
| GET /v1/possible-partners             | GET    | ✅      | —   | ✅  | ✅  | —   | 2      |
| GET /v1/possible-partners/id/:id      | GET    | ✅      | —   | ✅  | —   | —   | 1      |
| POST /v1/possible-partners/call       | POST   | ✅      | —   | ✅  | ✅  | —   | 3      |
| DELETE /v1/possible-partners/call/:id | DELETE | ✅      | —   | —   | ✅  | —   | 1      |

**Cenarios testados**:

- Criação pública de lead com payload válido e payload inválido
- Listagem somente para admin
- Busca por id somente para admin
- Registro de chamada para admin e manager, com bloqueio para user comum
- Remoção de chamada para admin

---

## Calls Module (6 endpoints)

| Endpoint                  | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| POST /v1/calls            | POST   | ✅      | ✅  | —   | ✅  | —   | 2      |
| GET /v1/calls             | GET    | ✅      | —   | —   | ✅  | —   | 2      |
| GET /v1/calls/user        | GET    | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/calls/id/:id      | GET    | ✅      | —   | —   | —   | —   | 1      |
| PATCH /v1/calls/:id       | PATCH  | ✅      | —   | —   | —   | —   | 1      |
| DELETE /v1/calls/:id      | DELETE | ✅      | —   | —   | —   | —   | 1      |

**Cenários testados**:

- Criação de chamado com admin e payload inválido
- Listagem de chamados como admin e bloqueio para user comum
- Listagem de chamados do próprio usuário
- Busca, atualização e remoção de chamado como admin

---

## FAQ Module (5 endpoints)

| Endpoint               | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ---------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| GET /v1/faq            | GET    | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/faq/:id        | GET    | ✅      | —   | —   | —   | —   | 1      |
| POST /v1/faq           | POST   | ✅      | —   | —   | ✅  | —   | 2      |
| PUT /v1/faq/:id        | PUT    | ✅      | —   | —   | —   | —   | 1      |
| DELETE /v1/faq/:id     | DELETE | ✅      | —   | —   | —   | —   | 1      |

**Cenários testados**:

- Listagem pública de FAQs
- Busca pública de FAQ por id
- Criação de FAQ para admin com bloqueio para usuário comum
- Atualização e remoção de FAQ para admin

---

## Notifications Module (6 endpoints)

| Endpoint                          | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| --------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| POST /v1/notifications           | POST   | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/notifications            | GET    | ✅      | —   | —   | —   | —   | 1      |
| GET /v1/notifications/:id        | GET    | ✅      | —   | —   | —   | —   | 1      |
| PATCH /v1/notifications/:id      | PATCH  | ✅      | —   | —   | —   | —   | 1      |
| PATCH /v1/notifications/:id/read | PATCH  | ✅      | —   | —   | —   | —   | 1      |
| DELETE /v1/notifications/:id     | DELETE | ✅      | —   | —   | —   | —   | 1      |

**Cenários testados**:

- Criação de notificação para admin
- Listagem de notificações do usuário logado
- Busca, atualização, marcação como lida e remoção de notificação

---

## Reports Module (8 endpoints)

| Endpoint                            | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ----------------------------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| GET /v1/reports/students            | GET    | ✅      | —   | —   | ✅  | —   | 2      |
| GET /v1/reports/students/called     | GET    | ✅      | —   | —   | ✅  | —   | 2      |
| GET /v1/reports/students/to_call    | GET    | ✅      | —   | —   | ✅  | —   | 2      |
| GET /v1/reports/students/renewals   | GET    | ✅      | ✅  | —   | ✅  | —   | 2      |
| GET /v1/reports/students/defaulters | GET    | ✅      | —   | —   | ✅  | —   | 1      |
| GET /v1/reports/general             | GET    | ✅      | ✅  | —   | ✅  | —   | 2      |
| GET /v1/reports/payments            | GET    | ✅      | ✅  | —   | —   | —   | 2      |
| GET /v1/reports/impact              | GET    | ✅      | —   | —   | ✅  | —   | 2      |

**Cenarios testados**:

- Relatório de alunos para admin e manager, com bloqueio para user comum
- Relatório de alunos chamados apenas para admin
- Relatório de renovação com janela válida e payload inválido
- Relatório geral com validação de parâmetros obrigatórios
- Relatório de pagamentos da ordem autenticada e validação de `order_id`
- Relatório de impacto com instituição obrigatória para admin

---

## Uploads Module (2 endpoints)

| Endpoint          | Método | 200/201 | 400 | 401 | 403 | 429 | Testes |
| ----------------- | ------ | ------- | --- | --- | --- | --- | ------ |
| POST /v1/uploads  | POST   | ✅      | ✅  | ✅  | —   | —   | 7      |
| DELETE /v1/uploads | DELETE | ✅     | ✅  | ✅  | ✅  | —   | 4      |

**Cenarios testados**:

- Upload de imagem (PNG) e de PDF autenticados, com resposta contendo `url`/`key`
- Upload sem token (401) e sem arquivo (400)
- Conteúdo que não corresponde a nenhum tipo suportado, ex: script PHP renomeado (400)
- `Content-Type` declarado divergente do conteúdo real (400)
- Pasta de destino fora da lista permitida (400)
- Campo de arquivo com nome inesperado (400)
- Remoção apenas para admin (403 para user comum) e key fora do formato gerado (400)

> As rotas de instituição (`POST`/`PUT /v1/institutions`) também aceitam a logo em
> `multipart/form-data`; os cenários de arquivo inválido estão em `institutions.e2e-spec.ts`.

---

## Resumo de Cobertura por Tipo de Status

| Status Code | Total Testado | Total Possível | %   |
| ----------- | ------------- | -------------- | --- |
| **200/201** | 98            | ~110           | 89% |
| **400**     | 14            | ~20            | 70% |
| **401**     | 40            | ~45            | 88% |
| **403**     | 28            | ~30            | 93% |
| **429**     | 2             | ~3             | 67% |

---

## Próximas Etapas

### Alta Prioridade (Validação)

- [x] Testar POST /v1/scholarships/change com payload válido
- [x] Testar POST /v1/scholarships/new_value com payload válido
- [x] Testar PUT /v1/scholarships/:id com payload válido e admin (200)
- [x] Testar POST /v1/users com payload válido e admin (201)
- [x] Testar PATCH /v1/users/:id/toggle

### Média Prioridade (Validação de Input)

- [x] Testar 400 Bad Request com payloads vazios (todos os POST/PUT)
- [x] Testar 400 Bad Request com campos obrigatórios faltando
- [x] Testar 400 Bad Request com tipos incorretos (ex: string em campo numérico)

### Baixa Prioridade (Edge Cases)

- [ ] Testar 429 em outros endpoints além de /login
- [ ] Testar timeout/performance em listas grandes
- [ ] Testar IDs inválidos (formato incorrect, não encontrado)

---

## Como Adicionar Testes

1. Identifique o endpoint faltando na matriz
2. Adicione o teste ao arquivo `test/e2e/<dominio>.e2e-spec.ts` correspondente
3. Use `shared.ts` para reutilizar mocks e dados
4. Execute `npm run test:e2e -- <dominio>.e2e-spec.ts`
5. Atualize esta matriz com o novo teste

**Exemplo**:

```typescript
describe('POST /v1/users', () => {
  it('deve retornar 201 com payload valido para admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Novo Usuario',
        email: 'novo@test.com',
        phone: '11999999999',
        // ... outros campos obrigatorios
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
  });
});
```

---

## Comando para Executar Testes

```bash
# Todos os testes e2e
npm run test:e2e

# Um dominio especifico
npm run test:e2e -- auth.e2e-spec.ts
npm run test:e2e -- scholarships.e2e-spec.ts

# Com coverage
npm run test:e2e -- --coverage
```

---

Última atualização: 2026-05-16  
Versão: 1.0 (Modularizado)
