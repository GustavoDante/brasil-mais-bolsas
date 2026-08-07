import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppException } from '../../src/common/exceptions/app.exception';
import {
  createTestApp,
  paymentsServiceMock,
  validBoletoPaymentPayload,
  validCreditCardPaymentPayload,
  validPixPaymentPayload,
} from './shared';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let userToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    userToken = tokens.userToken;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/payment/credit_card', () => {
    it('deve criar pagamento com cartao de credito', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/payment/credit_card')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCreditCardPaymentPayload)
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(paymentsServiceMock.createCreditCardPayment).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ scholarship_id: 'scholarship-1' }),
      );
    });

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/payment/credit_card')
        .send(validCreditCardPaymentPayload)
        .expect(401));

    it('deve retornar 400 com payload invalido', () =>
      request(app.getHttpServer())
        .post('/v1/payment/credit_card')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validCreditCardPaymentPayload, remoteIp: 'ip-invalido' })
        .expect(400));

    it('deve retornar 400 com campo extra', () =>
      request(app.getHttpServer())
        .post('/v1/payment/credit_card')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validCreditCardPaymentPayload, gateway: 'wirecard' })
        .expect(400));
  });

  describe('POST /v1/payment/asaas/boleto', () => {
    it('deve criar cobranca por boleto', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/payment/asaas/boleto')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validBoletoPaymentPayload)
        .expect(201);

      expect(response.body.message).toBe('boleto-payment-created');
      expect(paymentsServiceMock.createBoletoPayment).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ scholarship_id: 'scholarship-1' }),
      );
    });

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/payment/asaas/boleto')
        .send(validBoletoPaymentPayload)
        .expect(401));

    it('deve retornar 400 com campo extra', () =>
      request(app.getHttpServer())
        .post('/v1/payment/asaas/boleto')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...validBoletoPaymentPayload, installment_count: 3 })
        .expect(400));
  });

  describe('GET /v1/payment/:id', () => {
    it('deve devolver o pagamento do proprio usuario', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/payment/payment-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        payment: { id: 'payment-1', status: 'CONFIRMED' },
      });
      expect(paymentsServiceMock.findOwnPayment).toHaveBeenCalledWith('user-1', 'payment-1');
    });

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/payment/payment-1').expect(401));

    it('deve retornar 404 quando o pagamento nao e do usuario', async () => {
      paymentsServiceMock.findOwnPayment.mockRejectedValueOnce(
        new AppException('payment-not-found'),
      );

      await request(app.getHttpServer())
        .get('/v1/payment/payment-de-outro')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('POST /v1/payment/asaas/pix', () => {
    it('deve criar pagamento PIX via Asaas', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/payment/asaas/pix')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPixPaymentPayload)
        .expect(201);

      expect(response.body.message).toBe('pix-payment-created');
      expect(paymentsServiceMock.createPixPayment).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ scholarship_id: 'scholarship-1' }),
      );
    });
  });

  describe('POST /v1/payment/asaas/webhook', () => {
    it('deve processar webhook valido do Asaas', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/payment/asaas/webhook')
        .set('asaas-access-token', 'webhook-token')
        .send({
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_123',
            status: 'CONFIRMED',
            billingType: 'PIX',
          },
        })
        .expect(201);

      expect(response.body.message).toBe('asaas-webhook-processed');
      expect(paymentsServiceMock.handleAsaasWebhook).toHaveBeenCalledWith(
        'webhook-token',
        expect.objectContaining({ event: 'PAYMENT_CONFIRMED' }),
      );
    });

    it('deve retornar 401 com token invalido no webhook', () =>
      request(app.getHttpServer())
        .post('/v1/payment/asaas/webhook')
        .set('asaas-access-token', 'token-invalido')
        .send({
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_123',
            status: 'CONFIRMED',
            billingType: 'PIX',
          },
        })
        .expect(401));
  });
});
