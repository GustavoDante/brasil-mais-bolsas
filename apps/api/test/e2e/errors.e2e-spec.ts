import type { INestApplication } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { contactServiceMock, createTestApp, usersServiceMock, validContactPayload } from './shared';
import { AppException } from '../../src/common/exceptions/app.exception';

/**
 * O contrato do corpo de erro.
 *
 * Toda resposta de falha da API sai daqui com a mesma forma, e o frontend depende disso:
 * ele exibe a `message` como veio e decide comportamento pelo `code`. Estes casos cobrem
 * os quatro caminhos de resolução do `AllExceptionsFilter` — sem eles, uma mudança no
 * filtro passaria despercebida, porque nenhum outro e2e olha para o corpo do erro.
 */
describe('Formato de erro (e2e)', () => {
  let app: INestApplication;
  let throttlerStorage: ThrottlerStorage;
  let adminToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    adminToken = testApp.tokens.adminToken;
    throttlerStorage = app.get(ThrottlerStorage);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    contactServiceMock.submit.mockReset();
    contactServiceMock.submit.mockResolvedValue({ ok: true, message: 'contact-sent' });
    (throttlerStorage as unknown as { storage: Map<string, unknown> }).storage.clear();
  });

  // 1. Erro nosso: o código escolhido no `throw` chega intacto ao cliente, e a mensagem
  //    vem do catálogo — não do texto que alguém digitou no service.
  it('AppException → code e message do catálogo', async () => {
    contactServiceMock.submit.mockRejectedValue(new AppException('contact-not-configured'));

    const { body } = await request(app.getHttpServer())
      .post('/v1/contact')
      .send(validContactPayload)
      .expect(503);

    expect(body).toMatchObject({
      ok: false,
      code: 'contact-not-configured',
      message: 'O canal de contato não está configurado. Tente novamente mais tarde.',
      statusCode: 503,
      path: '/v1/contact',
    });
    expect(typeof body.timestamp).toBe('string');
  });

  it('AppException com mensagem de terceiro → o texto do gateway substitui o do catálogo', async () => {
    contactServiceMock.submit.mockRejectedValue(
      new AppException('asaas-rejected', { message: 'CPF inválido' }),
    );

    const { body } = await request(app.getHttpServer())
      .post('/v1/contact')
      .send(validContactPayload)
      .expect(400);

    expect(body).toMatchObject({ code: 'asaas-rejected', message: 'CPF inválido' });
  });

  // 2. Validação: o `fieldErrors` é o que permite ao formulário marcar o input errado.
  it('ZodValidationException → validation-error com fieldErrors por campo', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/v1/contact')
      .send({ name: 'Joao' })
      .expect(400);

    expect(body).toMatchObject({
      ok: false,
      code: 'validation-error',
      message: 'Confira os campos destacados.',
      statusCode: 400,
    });
    expect(Object.keys(body.fieldErrors).length).toBeGreaterThan(0);
    expect(body.fieldErrors.email).toEqual(expect.arrayContaining([expect.any(String)]));
  });

  // 3. HttpException que não é nossa: o throttler responde 429 com um texto técnico em
  //    inglês. O status é aproveitado; o texto, não.
  it('ThrottlerException → too-many-requests, sem vazar o texto do Nest', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer()).post('/v1/contact').send(validContactPayload).expect(201);
    }

    const { body } = await request(app.getHttpServer())
      .post('/v1/contact')
      .send(validContactPayload)
      .expect(429);

    expect(body).toMatchObject({
      ok: false,
      code: 'too-many-requests',
      message: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
    });
    expect(JSON.stringify(body)).not.toContain('ThrottlerException');
  });

  it('guard sem token → unauthorized', async () => {
    const { body } = await request(app.getHttpServer()).get('/v1/users').expect(401);

    expect(body).toMatchObject({ ok: false, code: 'unauthorized', statusCode: 401 });
  });

  // 4. Qualquer outra coisa é bug. A mensagem original pode conter query, stack ou string
  //    de conexão — o cliente recebe só o genérico.
  it('exceção não-HTTP → internal-error sem vazar a mensagem original', async () => {
    usersServiceMock.findAll.mockRejectedValue(
      new Error('connect ECONNREFUSED postgres://user:senha@db:5432'),
    );

    const { body } = await request(app.getHttpServer())
      .get('/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(500);

    expect(body).toMatchObject({
      ok: false,
      code: 'internal-error',
      message: 'Tivemos um problema no servidor. Tente novamente em instantes.',
      statusCode: 500,
    });
    expect(JSON.stringify(body)).not.toContain('senha');
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
  });
});
