import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, ordersServiceMock } from './shared';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let managerToken = '';
  let userToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    adminToken = tokens.adminToken;
    managerToken = tokens.managerToken;
    userToken = tokens.userToken;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/order', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/order')
        .send({ user_id: 'user-1', scholarship_id: 'scholarship-1' })
        .expect(401));

    it('deve retornar 403 para usuario comum', () =>
      request(app.getHttpServer())
        .post('/v1/order')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ user_id: 'user-1', scholarship_id: 'scholarship-1' })
        .expect(403));

    it('deve criar pedido para admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: 'user-1', scholarship_id: 'scholarship-1' })
        .expect(201);

      expect(response.body.message).toBe('order-created');
      expect(ordersServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', scholarship_id: 'scholarship-1' }),
      );
    });

    it('deve retornar 400 com payload invalido', () =>
      request(app.getHttpServer())
        .post('/v1/order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ user_id: 'user-1' })
        .expect(400));
  });

  describe('GET /v1/order', () => {
    it('deve listar pedidos do usuario autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/order')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(ordersServiceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /v1/order/id/:id', () => {
    it('deve buscar pedido por id', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/order/id/order-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.order.id).toBe('order-1');
    });
  });

  describe('PUT /v1/order/change', () => {
    it('deve trocar bolsa do pedido para admin', async () => {
      const response = await request(app.getHttpServer())
        .put('/v1/order/change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderId: 'order-1', newScholarshipId: 'scholarship-2' })
        .expect(200);

      expect(response.body.order.id).toBe('order-1');
      expect(ordersServiceMock.changeScholarship).toHaveBeenCalled();
    });
  });

  describe('POST /v1/order/update-defaulter', () => {
    it('deve atualizar inadimplencia para manager ou admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/order/update-defaulter')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ order_id: 'order-1', defaulter: true })
        .expect(201);

      expect(response.body.message).toBe('Pedido marcado como inadimplente');
      expect(ordersServiceMock.updateDefaulter).toHaveBeenCalled();
    });
  });

  describe('GET /v1/order/voucher', () => {
    it('deve buscar voucher pago do usuario', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/order/voucher')
        .query({ scholarship_id: 'scholarship-1' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.voucher.id).toBe('order-1');
    });
  });

  describe('GET /v1/order/payments', () => {
    it('deve listar pagamentos do pedido', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/order/payments')
        .query({ order_id: 'order-1' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payments[0].status).toBe('PAID');
    });
  });

  describe('GET /v1/order/expired', () => {
    it('deve listar pedidos expirados para admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/order/expired')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.orders)).toBe(true);
    });
  });
});
