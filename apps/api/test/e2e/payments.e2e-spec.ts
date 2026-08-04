import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  paymentsServiceMock,
  validCreditCardPaymentPayload,
  validInterestPaymentPayload,
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

  describe('POST /v1/payment/create-interest-payment', () => {
    it('deve registrar pagamento de interesse', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/payment/create-interest-payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validInterestPaymentPayload)
        .expect(201);

      expect(response.body.paymentId).toBe('payment-1');
      expect(paymentsServiceMock.createInterestPayment).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ scholarship_id: 'scholarship-1' }),
      );
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
