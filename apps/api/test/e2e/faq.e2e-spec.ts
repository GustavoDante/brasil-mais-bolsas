import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, validCreateFaqPayload } from './shared';

describe('FAQ (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/faq', () => {
    it('deve listar FAQs publicamente -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/faq')
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.faqs)).toBe(true);
        }));
  });

  describe('POST /v1/faq', () => {
    it('deve criar FAQ para admin -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/faq')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateFaqPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('faq-created');
        }));

    it('deve rejeitar user comum -> 403', () =>
      request(app.getHttpServer())
        .post('/v1/faq')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCreateFaqPayload)
        .expect(403));
  });

  describe('GET /v1/faq/:id', () => {
    it('deve buscar FAQ por id publicamente -> 200', () =>
      request(app.getHttpServer()).get('/v1/faq/faq-1').expect(200));
  });

  describe('PUT /v1/faq/:id', () => {
    it('deve atualizar FAQ para admin -> 200', () =>
      request(app.getHttpServer())
        .put('/v1/faq/faq-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Nova pergunta' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('faq-updated');
        }));
  });

  describe('DELETE /v1/faq/:id', () => {
    it('deve remover FAQ para admin -> 200', () =>
      request(app.getHttpServer())
        .delete('/v1/faq/faq-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('faq-deleted');
        }));
  });
});
