import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, validCreateCallPayload } from './shared';

describe('Calls (e2e)', () => {
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

  describe('POST /v1/calls', () => {
    it('deve criar um chamado para admin -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/calls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateCallPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(res.body.message).toBe('call-created');
        }));

    it('deve rejeitar payload inválido -> 400', () =>
      request(app.getHttpServer())
        .post('/v1/calls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ receiver_id: 'user-1' })
        .expect(400));
  });

  describe('GET /v1/calls', () => {
    it('deve listar chamados para admin -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/calls')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.calls)).toBe(true);
        }));

    it('deve rejeitar user comum -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/calls')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));
  });

  describe('GET /v1/calls/user', () => {
    it('deve listar chamados do usuário logado -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/calls/user')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.calls)).toBe(true);
        }));
  });

  describe('GET /v1/calls/id/:id', () => {
    it('deve buscar um chamado por id para admin -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/calls/id/call-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('PATCH /v1/calls/:id', () => {
    it('deve atualizar um chamado para admin -> 200', () =>
      request(app.getHttpServer())
        .patch('/v1/calls/call-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Ligação atualizada' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('call-updated');
        }));
  });

  describe('DELETE /v1/calls/:id', () => {
    it('deve remover um chamado para admin -> 200', () =>
      request(app.getHttpServer())
        .delete('/v1/calls/call-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('call-deleted');
        }));
  });
});
