import type { INestApplication } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { contactServiceMock, createTestApp, validContactPayload } from './shared';
import { AppException } from '../../src/common/exceptions/app.exception';

describe('Contact (e2e)', () => {
  let app: INestApplication;
  let throttlerStorage: ThrottlerStorage;

  beforeAll(async () => {
    const { app: testApp } = await createTestApp();
    app = testApp;
    throttlerStorage = app.get(ThrottlerStorage);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    contactServiceMock.submit.mockReset();
    contactServiceMock.submit.mockResolvedValue({ ok: true, message: 'contact-sent' });

    // A rota tem limite proprio de 5 req/min. Sem zerar o contador entre os casos, os
    // ultimos testes do arquivo recebem 429 e mascaram o que estao de fato verificando.
    (throttlerStorage as unknown as { storage: Map<string, unknown> }).storage.clear();
  });

  describe('POST /v1/contact', () => {
    it('deve aceitar payload valido sem autenticacao → 201', () =>
      request(app.getHttpServer())
        .post('/v1/contact')
        .send(validContactPayload)
        .expect(201)
        .expect(({ body }) => {
          expect(body).toEqual({ ok: true, message: 'contact-sent' });
        }));

    it('deve aceitar o campo type opcional', () =>
      request(app.getHttpServer())
        .post('/v1/contact')
        .send({ ...validContactPayload, type: 'souParceiro' })
        .expect(201));

    it('deve recusar type fora da lista → 400', () =>
      request(app.getHttpServer())
        .post('/v1/contact')
        .send({ ...validContactPayload, type: 'souQualquerCoisa' })
        .expect(400));

    it('deve recusar e-mail invalido → 400', () =>
      request(app.getHttpServer())
        .post('/v1/contact')
        .send({ ...validContactPayload, email: 'nao-e-email' })
        .expect(400));

    it('deve recusar mensagem curta demais → 400', () =>
      request(app.getHttpServer())
        .post('/v1/contact')
        .send({ ...validContactPayload, message: 'oi' })
        .expect(400));

    it('deve recusar payload sem campos obrigatorios → 400', () =>
      request(app.getHttpServer()).post('/v1/contact').send({ name: 'Joao' }).expect(400));

    // A rota e publica e dispara e-mail: aceitar o destinatario do cliente a
    // transformaria em relay aberto. O campo nao existe no DTO, entao o
    // forbidNonWhitelisted rejeita a requisicao inteira.
    it('deve rejeitar targetEmail vindo do cliente → 400', async () => {
      await request(app.getHttpServer())
        .post('/v1/contact')
        .send({ ...validContactPayload, targetEmail: 'atacante@evil.com' })
        .expect(400);

      expect(contactServiceMock.submit).not.toHaveBeenCalled();
    });

    it('deve propagar 503 quando o envio estiver indisponivel', async () => {
      contactServiceMock.submit.mockRejectedValue(new AppException('contact-not-delivered'));

      await request(app.getHttpServer()).post('/v1/contact').send(validContactPayload).expect(503);
    });

    it('deve barrar com 429 a partir da 6a requisicao no minuto', async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await request(app.getHttpServer())
          .post('/v1/contact')
          .send(validContactPayload)
          .expect(201);
      }

      await request(app.getHttpServer()).post('/v1/contact').send(validContactPayload).expect(429);
    });
  });
});
