import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, validCreateCoursePayload } from './shared';

describe('Courses (e2e)', () => {
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

  describe('GET /v1/courses', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/courses').expect(401));

    it('deve retornar 200 com token manager', () =>
      request(app.getHttpServer())
        .get('/v1/courses')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));

    it('deve retornar 200 com token admin', () =>
      request(app.getHttpServer())
        .get('/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('GET /v1/courses/institution/:institutionId', () => {
    it('deve retornar 200 (rota publica, sem autenticacao)', () =>
      request(app.getHttpServer()).get('/v1/courses/institution/faculdade').expect(200));

    it('deve retornar 200 com token', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/courses/institution/faculdade')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /v1/courses/search', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/courses/search?term=admin').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/courses/search?term=admin')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));
  });

  describe('GET /v1/courses/id/:id', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/courses/id/course-1').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/courses/id/course-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));
  });

  describe('POST /v1/courses', () => {
    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .post('/v1/courses')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateCoursePayload)
        .expect(403));

    it('deve retornar 201 para admin', () =>
      request(app.getHttpServer())
        .post('/v1/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateCoursePayload)
        .expect(201));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).post('/v1/courses').send(validCreateCoursePayload).expect(401));
  });

  describe('PUT /v1/courses/:id', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .put('/v1/courses/course-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateCoursePayload)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .put('/v1/courses/course-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateCoursePayload)
        .expect(200));
  });

  describe('DELETE /v1/courses/:id', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .delete('/v1/courses/course-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .delete('/v1/courses/course-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('PATCH /v1/courses/:id/toggle', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .patch('/v1/courses/course-1/toggle')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .patch('/v1/courses/course-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });
});
