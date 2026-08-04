import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './shared';

describe('Reports (e2e)', () => {
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

  describe('GET /v1/reports/students', () => {
    it('deve retornar lista de alunos para admin -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.students)).toBe(true);
        }));

    it('deve retornar lista de alunos para manager -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));

    it('deve rejeitar usuário comum -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));
  });

  describe('GET /v1/reports/students/called', () => {
    it('deve retornar alunos chamados pelo admin -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students/called')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.students)).toBe(true);
        }));

    it('deve rejeitar manager -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students/called')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('GET /v1/reports/students/to_call', () => {
    it('deve retornar alunos para ligar (apenas admin) -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students/to_call')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('deve rejeitar manager -> 403', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students/to_call')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));
  });

  describe('GET /v1/reports/students/renewals', () => {
    it('deve retornar alunos com renovação próxima -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students/renewals')
        .query({ days: 30 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.students)).toBe(true);
        }));

    it('deve rejeitar payload inválido para days -> 400', () =>
      request(app.getHttpServer())
        .get('/v1/reports/students/renewals')
        .query({ days: 0 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400));
  });

  describe('GET /v1/reports/general', () => {
    it('deve retornar relatório geral -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/general')
        .query({
          institution: 'all',
          course: 'all',
          start_date: '2023-01-01',
          end_date: '2023-12-31',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('deve rejeitar se faltar query params -> 400', () =>
      request(app.getHttpServer())
        .get('/v1/reports/general')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400));
  });

  describe('GET /v1/reports/payments', () => {
    it('deve retornar pagamentos de uma ordem do usuário -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/payments')
        .query({ order_id: 'order-1' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.payments)).toBe(true);
        }));

    it('deve rejeitar se faltar order_id -> 400', () =>
      request(app.getHttpServer())
        .get('/v1/reports/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400));
  });

  describe('GET /v1/reports/impact', () => {
    it('deve retornar relatório de impacto -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/impact')
        .query({ institution: 'institution-1' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('deve aceitar manager sem query de institution (usa a dele) -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/reports/impact')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));
  });
});
