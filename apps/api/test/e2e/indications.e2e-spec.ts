import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  validCreateIndicationCallPayload,
  validCreateIndicationPayload,
} from './shared';

describe('Indications (e2e)', () => {
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

  describe('POST /v1/indications', () => {
    it('deve criar uma indicação -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/indications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCreateIndicationPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(res.body.message).toBe('indication-created');
        }));

    it('deve rejeitar sem token -> 401', () =>
      request(app.getHttpServer())
        .post('/v1/indications')
        .send(validCreateIndicationPayload)
        .expect(401));

    it('deve rejeitar payload incompleto -> 400', () =>
      request(app.getHttpServer())
        .post('/v1/indications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Só nome' })
        .expect(400));
  });

  describe('GET /v1/indications', () => {
    it('deve retornar todas as indicações (admin) -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/indications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.indications)).toBe(true);
        }));

    it('deve rejeitar se não for admin -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/indications')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('GET /v1/indications/user', () => {
    it('deve retornar indicações do usuário logado -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/indications/user')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.indications)).toBe(true);
        }));
  });

  describe('POST /v1/indications/call', () => {
    it('deve registrar uma chamada (admin) -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/indications/call')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateIndicationCallPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(res.body.message).toBe('indication-call-created');
        }));

    it('deve registrar uma chamada (manager) -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/indications/call')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateIndicationCallPayload)
        .expect(201));

    it('deve rejeitar se for user comum -> 403', () =>
      request(app.getHttpServer())
        .post('/v1/indications/call')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCreateIndicationCallPayload)
        .expect(403));
  });

  describe('DELETE /v1/indications/call/:id', () => {
    it('deve remover uma chamada (admin) -> 200', () =>
      request(app.getHttpServer())
        .delete('/v1/indications/call/call-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('indication-call-deleted');
        }));

    it('deve rejeitar se não for admin -> 403', () =>
      request(app.getHttpServer())
        .delete('/v1/indications/call/call-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });
});
