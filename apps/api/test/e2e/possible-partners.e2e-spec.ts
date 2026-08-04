import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, validCreatePossiblePartnerPayload } from './shared';

describe('Possible Partners (e2e)', () => {
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

  describe('POST /v1/possible-partners', () => {
    it('deve criar lead publicamente -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/possible-partners')
        .send(validCreatePossiblePartnerPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
        }));

    it('deve rejeitar payload inválido -> 400', () =>
      request(app.getHttpServer())
        .post('/v1/possible-partners')
        .send({ email: 'not-an-email' })
        .expect(400));
  });

  describe('GET /v1/possible-partners', () => {
    it('deve retornar leads para admin -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/possible-partners')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.possiblePartners)).toBe(true);
        }));

    it('deve rejeitar não-admin -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/possible-partners')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('GET /v1/possible-partners/id/:id', () => {
    it('deve retornar lead por id para admin -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/possible-partners/id/possible-partner-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('POST /v1/possible-partners/call', () => {
    it('deve criar chamada para admin -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/possible-partners/call')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ possible_partner_id: 'possible-partner-1', description: 'Ligação' })
        .expect(201));

    it('deve criar chamada para manager -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/possible-partners/call')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ possible_partner_id: 'possible-partner-1', description: 'Ligação' })
        .expect(201));

    it('deve rejeitar user comum -> 403', () =>
      request(app.getHttpServer())
        .post('/v1/possible-partners/call')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ possible_partner_id: 'possible-partner-1', description: 'Ligação' })
        .expect(403));
  });

  describe('DELETE /v1/possible-partners/call/:id', () => {
    it('deve remover chamada para admin -> 200', () =>
      request(app.getHttpServer())
        .delete('/v1/possible-partners/call/call-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });
});
