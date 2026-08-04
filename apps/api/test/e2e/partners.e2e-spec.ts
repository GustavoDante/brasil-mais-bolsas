import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, validCreatePartnerPayload } from './shared';

describe('Partners (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let managerToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    adminToken = tokens.adminToken;
    managerToken = tokens.managerToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/partners', () => {
    it('should create a partner (admin) -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/partners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreatePartnerPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
        }));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .post('/v1/partners')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreatePartnerPayload)
        .expect(403));

    it('should reject empty payload -> 400', () =>
      request(app.getHttpServer())
        .post('/v1/partners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400));
  });

  describe('GET /v1/partners', () => {
    it('should get all partners (admin) -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/partners')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.partners)).toBe(true);
        }));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/partners')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('POST /v1/partners/login', () => {
    it('should authenticate a partner -> 200', () =>
      request(app.getHttpServer())
        .post('/v1/partners/login')
        .send({ code: 'PARCEIRO_MASTER', password: 'password123' })
        .expect(200) // we used @HttpCode(200) in the controller
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(res.body.partner.name).toBe('Partner Test');
        }));

    it('should reject invalid payload -> 400', () =>
      request(app.getHttpServer())
        .post('/v1/partners/login')
        .send({ code: 'PARCEIRO_MASTER' }) // missing password
        .expect(400));
  });

  describe('GET /v1/partners/id/:id', () => {
    it('should get specific partner (admin) -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/partners/id/partner-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/partners/id/partner-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('PUT /v1/partners/:id', () => {
    it('should update partner (admin) -> 200', () =>
      request(app.getHttpServer())
        .put('/v1/partners/partner-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Novo Nome' })
        .expect(200));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .put('/v1/partners/partner-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Novo Nome' })
        .expect(403));
  });

  describe('DELETE /v1/partners/:id', () => {
    it('should delete partner (admin) -> 200', () =>
      request(app.getHttpServer())
        .delete('/v1/partners/partner-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .delete('/v1/partners/partner-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('PATCH /v1/partners/:id/toggle', () => {
    it('should toggle partner (admin) -> 200', () =>
      request(app.getHttpServer())
        .patch('/v1/partners/partner-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('should reject if not admin -> 403', () =>
      request(app.getHttpServer())
        .patch('/v1/partners/partner-1/toggle')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('POST /v1/partners/access', () => {
    it('should register access -> 200', () =>
      request(app.getHttpServer())
        .post('/v1/partners/access')
        .send({ partner_code: 'PARCEIRO_MASTER' })
        .expect(200));

    it('should fail with empty payload -> 400', () =>
      request(app.getHttpServer()).post('/v1/partners/access').send({}).expect(400));
  });
});
