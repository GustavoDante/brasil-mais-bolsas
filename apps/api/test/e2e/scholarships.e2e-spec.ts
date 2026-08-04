import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  validChangeScholarshipPayload,
  validCreateScholarshipPayload,
  validNewScholarshipValuePayload,
} from './shared';

describe('Scholarships (e2e)', () => {
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

  describe('GET /v1/scholarships/search/city', () => {
    it('deve retornar 200 com parametro de busca (publica)', () =>
      request(app.getHttpServer()).get('/v1/scholarships/search/city?term=sao').expect(200));
  });

  describe('GET /v1/scholarships/list/city', () => {
    it('deve retornar 200 (rota publica, sem autenticacao)', () =>
      request(app.getHttpServer()).get('/v1/scholarships/list/city').expect(200));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/list/city')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200));
  });

  describe('GET /v1/scholarships', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/scholarships').expect(401));

    it('deve retornar 200 com token de manager', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));

    it('deve retornar 200 com token de admin', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('GET /v1/scholarships/list/index', () => {
    it('deve retornar 200 (publica)', () =>
      request(app.getHttpServer()).get('/v1/scholarships/list/index').expect(200));
  });

  describe('GET /v1/scholarships/list/random', () => {
    // Rota publica por design: alimenta as vitrines de bolsas nas paginas publicas do site.
    it('deve retornar 200 sem token (publica)', () =>
      request(app.getHttpServer()).get('/v1/scholarships/list/random').expect(200));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/list/random')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));
  });

  describe('GET /v1/scholarships/list/all', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/scholarships/list/all').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/list/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('GET /v1/scholarships/list/backoffice', () => {
    it('deve retornar 403 para user comum', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/list/backoffice')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));

    it('deve retornar 200 para manager', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/list/backoffice')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/scholarships/list/backoffice').expect(401));
  });

  describe('GET /v1/scholarships/search/institution', () => {
    it('deve retornar 200 com parametro de busca (publica)', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/search/institution?term=faculdade')
        .expect(200));
  });

  describe('GET /v1/scholarships/search/course', () => {
    it('deve retornar 200 com parametro de busca (publica)', () =>
      request(app.getHttpServer()).get('/v1/scholarships/search/course?term=admin').expect(200));
  });

  describe('POST /v1/scholarships', () => {
    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateScholarshipPayload)
        .expect(403));

    it('deve retornar 201 para admin', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateScholarshipPayload)
        .expect(201));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .send(validCreateScholarshipPayload)
        .expect(401));

    // Média prioridade: validação de input
    it('deve retornar 400 com payload vazio', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400));

    it('deve retornar 400 com campo obrigatorio faltando (sem course_id)', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          shift: 'Manha',
          type: 'PRESENCIAL',
          full_price: 1000,
          discount: 50,
          quantity_offered: 10,
          renovation_days: 30,
          register_period_start: '2026-01-01T00:00:00.000Z',
          course_description: 'Descricao',
          institution_id: 'institution-1',
          // course_id ausente intencionalmente
        })
        .expect(400));

    it('deve retornar 400 com tipo incorreto em discount (string em campo numerico)', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCreateScholarshipPayload, discount: 'nao-e-numero' })
        .expect(400));

    it('deve retornar 400 com campo nao permitido (forbidNonWhitelisted)', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCreateScholarshipPayload, campo_proibido: 'valor' })
        .expect(400));
  });

  describe('GET /v1/scholarships/students_count/:id', () => {
    it('deve retornar 403 para user comum', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/students_count/scholarship-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));

    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/students_count/scholarship-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/students_count/scholarship-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/students_count/scholarship-1')
        .expect(401));
  });

  describe('GET /v1/scholarships/:id', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/scholarships/scholarship-1').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/scholarship-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('GET /v1/scholarships/old_id/:oldId', () => {
    it('deve retornar 200 (publica)', () =>
      request(app.getHttpServer()).get('/v1/scholarships/old_id/legacy-1').expect(200));
  });

  describe('GET /v1/scholarships/contract/:id', () => {
    it('deve retornar 200 com token valido', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/contract/scholarship-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/scholarships/contract/scholarship-1').expect(401));
  });

  describe('GET /v1/scholarships/renew/:id', () => {
    it('deve retornar 200 com token valido', () =>
      request(app.getHttpServer())
        .get('/v1/scholarships/renew/scholarship-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/scholarships/renew/scholarship-1').expect(401));
  });

  // ── Alta Prioridade: POST /change ─────────────────────────────────────────

  describe('POST /v1/scholarships/change', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships/change')
        .send({ scholarship_id: 'scholarship-1' })
        .expect(401));

    it('deve retornar 201 com payload valido para admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/scholarships/change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validChangeScholarshipPayload)
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.order).toBeDefined();
    });

    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships/change')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validChangeScholarshipPayload)
        .expect(403));

    // Média prioridade: validação de input
    it('deve retornar 400 com payload vazio', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships/change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400));

    it('deve retornar 400 com campo obrigatorio faltando (sem new_scholarship)', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships/change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ order_id: 'order-1' })
        .expect(400));
  });

  // ── Alta Prioridade: POST /new_value ──────────────────────────────────────

  describe('POST /v1/scholarships/new_value', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships/new_value')
        .send({ scholarship_id: 'scholarship-1', new_value: 2000 })
        .expect(401));

    it('deve retornar 201 com payload valido para admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/scholarships/new_value')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validNewScholarshipValuePayload)
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.scholarship).toBeDefined();
    });

    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships/new_value')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validNewScholarshipValuePayload)
        .expect(403));

    // Média prioridade: validação de input
    it('deve retornar 400 com payload vazio', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships/new_value')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400));

    it('deve retornar 400 com tipo incorreto em full_price (string em campo numerico)', () =>
      request(app.getHttpServer())
        .post('/v1/scholarships/new_value')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validNewScholarshipValuePayload, full_price: 'nao-e-numero' })
        .expect(400));
  });

  // ── Alta Prioridade: PUT /:id ─────────────────────────────────────────────

  describe('PUT /v1/scholarships/:id', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .put('/v1/scholarships/scholarship-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ full_price: 2000 })
        .expect(403));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .put('/v1/scholarships/scholarship-1')
        .send({ full_price: 2000 })
        .expect(401));

    it('deve retornar 200 para admin com payload valido', async () => {
      const response = await request(app.getHttpServer())
        .put('/v1/scholarships/scholarship-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ full_price: 2000, discount: 60 })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.message).toBe('scholarship-updated');
    });

    // Média prioridade: validação de input
    it('deve retornar 400 com tipo incorreto em full_price (string em campo numerico)', () =>
      request(app.getHttpServer())
        .put('/v1/scholarships/scholarship-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ full_price: 'nao-e-numero' })
        .expect(400));

    it('deve retornar 400 com campo nao permitido (forbidNonWhitelisted)', () =>
      request(app.getHttpServer())
        .put('/v1/scholarships/scholarship-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ campo_invalido: 'valor' })
        .expect(400));
  });

  describe('DELETE /v1/scholarships/:id', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .delete('/v1/scholarships/scholarship-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .delete('/v1/scholarships/scholarship-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('PATCH /v1/scholarships/:id/toggle', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .patch('/v1/scholarships/scholarship-1/toggle')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .patch('/v1/scholarships/scholarship-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });
});
