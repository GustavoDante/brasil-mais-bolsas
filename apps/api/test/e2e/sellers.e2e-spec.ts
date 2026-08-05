import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SellersService } from '../../src/modules/sellers/sellers.service';
import { createTestApp, validCreateSellerPayload } from './shared';
import { AppException } from '../../src/common/exceptions/app.exception';

describe('Sellers (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let managerToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    adminToken = tokens.adminToken;
    managerToken = tokens.managerToken;
  });

  const getSellersService = (): jest.Mocked<Pick<SellersService, 'login' | 'findOne'>> =>
    app.get(SellersService);

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/sellers', () => {
    it('should create a seller (admin) -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/sellers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateSellerPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
        }));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .post('/v1/sellers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateSellerPayload)
        .expect(403));

    it('should reject empty payload -> 400', () =>
      request(app.getHttpServer())
        .post('/v1/sellers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400));
  });

  describe('GET /v1/sellers', () => {
    it('should get all sellers (admin) -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/sellers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.sellers)).toBe(true);
        }));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/sellers')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('POST /v1/sellers/login', () => {
    it('should authenticate a seller -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/sellers/login')
        .send({ email: 'joao@vendedor.com', password: 'password123' })
        .expect(201) // default Post is 201 unless HttpCode(200) is used
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(res.body.seller.name).toBe('Seller Test');
        }));

    it('should reject invalid payload -> 400', () =>
      request(app.getHttpServer())
        .post('/v1/sellers/login')
        .send({ email: 'not-an-email' })
        .expect(400));

    it('should reject invalid credentials -> 400', async () => {
      getSellersService().login.mockRejectedValueOnce(new AppException('seller-not-found'));

      await request(app.getHttpServer())
        .post('/v1/sellers/login')
        .send({ email: 'joao@vendedor.com', password: 'wrong-password' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error ?? res.body.message).toBeDefined();
        });
    });
  });

  describe('GET /v1/sellers/id/:id', () => {
    it('should get specific seller (admin) -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/sellers/id/seller-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('should reject missing seller -> 400', async () => {
      getSellersService().findOne.mockRejectedValueOnce(new AppException('seller-not-found'));

      await request(app.getHttpServer())
        .get('/v1/sellers/id/missing-seller')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.error ?? res.body.message).toBeDefined();
        });
    });

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/sellers/id/seller-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('PUT /v1/sellers/:id', () => {
    it('should update seller (admin) -> 200', () =>
      request(app.getHttpServer())
        .put('/v1/sellers/seller-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Novo Nome' })
        .expect(200));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .put('/v1/sellers/seller-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Novo Nome' })
        .expect(403));
  });

  describe('DELETE /v1/sellers/:id', () => {
    it('should delete seller (admin) -> 200', () =>
      request(app.getHttpServer())
        .delete('/v1/sellers/seller-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .delete('/v1/sellers/seller-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('PATCH /v1/sellers/:id/toggle', () => {
    it('should toggle seller (admin) -> 200', () =>
      request(app.getHttpServer())
        .patch('/v1/sellers/seller-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .patch('/v1/sellers/seller-1/toggle')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });
});
