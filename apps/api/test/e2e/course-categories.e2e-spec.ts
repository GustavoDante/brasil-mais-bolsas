import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, validCreateCategoryPayload } from './shared';

describe('Course Categories (e2e)', () => {
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

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/course-categories', () => {
    it('deve retornar 200 (rota publica, sem autenticacao)', () =>
      request(app.getHttpServer()).get('/v1/course-categories').expect(200));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/course-categories')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200));
  });

  describe('GET /v1/course-categories/:id', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/course-categories/category-1').expect(401));

    it('deve retornar 200 com token valido', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/course-categories/category-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /v1/course-categories/old_id/:oldId', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/course-categories/old_id/legacy-1').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/course-categories/old_id/legacy-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200));
  });

  describe('POST /v1/course-categories', () => {
    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .post('/v1/course-categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateCategoryPayload)
        .expect(403));

    it('deve retornar 201 para admin', () =>
      request(app.getHttpServer())
        .post('/v1/course-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateCategoryPayload)
        .expect(201));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/course-categories')
        .send(validCreateCategoryPayload)
        .expect(401));
  });

  describe('PUT /v1/course-categories/:id', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .put('/v1/course-categories/category-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateCategoryPayload)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .put('/v1/course-categories/category-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateCategoryPayload)
        .expect(200));
  });

  describe('DELETE /v1/course-categories/:id', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .delete('/v1/course-categories/category-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .delete('/v1/course-categories/category-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('PATCH /v1/course-categories/:id/toggle', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .patch('/v1/course-categories/category-1/toggle')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .patch('/v1/course-categories/category-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });
});
