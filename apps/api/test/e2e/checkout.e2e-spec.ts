import { type INestApplication } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import {
  checkoutServiceMock,
  createTestApp,
  setupCheckoutServiceMocks,
  validCheckoutPayload,
  validCreditCardCheckoutPayload,
} from './shared';

describe('Checkout (e2e)', () => {
  let app: INestApplication;
  let throttlerStorage: ThrottlerStorage;
  let userToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    userToken = tokens.userToken;
    throttlerStorage = app.get(ThrottlerStorage);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupCheckoutServiceMocks();

    // A rota tem limite proprio de 5 req/min. Sem zerar o contador entre os casos, os
    // ultimos testes do arquivo recebem 429 e mascaram o que estao de fato verificando.
    (throttlerStorage as unknown as { storage: Map<string, unknown> }).storage.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/checkout', () => {
    it('deve contratar a bolsa sem sessao, criando o aluno', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/checkout')
        .send(validCheckoutPayload)
        .expect(201);

      expect(response.body.message).toBe('checkout-created');
      expect(response.body.checkout.accessToken).toBe('mocked-access-token');
      expect(checkoutServiceMock.checkout).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ scholarship_id: 'scholarship-1' }),
        // O IP do antifraude é o da requisição, resolvido pelo controller
        expect.any(String),
      );
    });

    it('deve contratar a bolsa com sessao, usando o usuario do token', async () => {
      await request(app.getHttpServer())
        .post('/v1/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCreditCardCheckoutPayload)
        .expect(201);

      expect(checkoutServiceMock.checkout).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
        expect.objectContaining({ scholarship_id: 'scholarship-1' }),
        expect.any(String),
      );
    });

    it('deve seguir como visitante quando o token e invalido', async () => {
      await request(app.getHttpServer())
        .post('/v1/checkout')
        .set('Authorization', 'Bearer token-invalido')
        .send(validCheckoutPayload)
        .expect(201);

      expect(checkoutServiceMock.checkout).toHaveBeenCalledWith(
        undefined,
        expect.anything(),
        expect.any(String),
      );
    });

    it('deve retornar 400 sem o aceite dos termos', () =>
      request(app.getHttpServer())
        .post('/v1/checkout')
        .send({ ...validCheckoutPayload, accepted_terms: false })
        .expect(400));

    it('deve retornar 400 quando o cartao vem sem os dados do cartao', () =>
      request(app.getHttpServer())
        .post('/v1/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          scholarship_id: 'scholarship-1',
          payment: { method: 'CREDIT_CARD' },
          accepted_terms: true,
        })
        .expect(400));

    it('deve retornar 400 quando o PIX vem com dados de cartao', () =>
      request(app.getHttpServer())
        .post('/v1/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validCreditCardCheckoutPayload,
          payment: { ...validCreditCardCheckoutPayload.payment, method: 'PIX' },
        })
        .expect(400));

    it('deve retornar 400 com campo desconhecido no corpo', () =>
      request(app.getHttpServer())
        .post('/v1/checkout')
        .send({ ...validCheckoutPayload, cupom: 'DESCONTO10' })
        .expect(400));

    it('deve retornar 400 quando o cadastro chega incompleto', () =>
      request(app.getHttpServer())
        .post('/v1/checkout')
        .send({
          ...validCheckoutPayload,
          customer: { ...validCheckoutPayload.customer, rg: undefined },
        })
        .expect(400));

    it('deve aplicar o rate limit de 5 requisicoes por minuto', async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await request(app.getHttpServer()).post('/v1/checkout').send(validCheckoutPayload);
      }

      await request(app.getHttpServer())
        .post('/v1/checkout')
        .send(validCheckoutPayload)
        .expect(429);
    });
  });
});
