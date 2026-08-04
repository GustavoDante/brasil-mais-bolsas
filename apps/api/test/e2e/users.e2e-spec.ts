import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, validCreateUserPayload, validCreateUserWithAddressPayload } from './shared';

describe('Users (e2e)', () => {
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

  describe('GET /v1/users', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/users').expect(401));

    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin e conter lista de usuarios', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });

  describe('GET /v1/users/me', () => {
    it('deve retornar 200 com token valido e conter dados do usuario logado', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.email).toBe('user@test.com');
      expect(response.body.password).toBeUndefined();
    });
  });

  describe('GET /v1/users/:id', () => {
    it('deve retornar 403 para usuario comum acessando outro id', () =>
      request(app.getHttpServer())
        .get('/v1/users/other-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));

    it('deve retornar 200 para admin consultando outro usuario', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/user-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  // ── Alta Prioridade: POST /v1/users ──────────────────────────────────────

  describe('POST /v1/users', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/users')
        .send(validCreateUserWithAddressPayload)
        .expect(401));

    it('deve retornar 400 quando payload invalido (sem campo address obrigatorio)', () =>
      request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateUserPayload)
        .expect(400));

    it('deve retornar 201 com payload valido para admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateUserWithAddressPayload)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.password).toBeUndefined();
    });

    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateUserWithAddressPayload)
        .expect(403));

    // Média prioridade: validação de input
    it('deve retornar 400 com payload vazio', () =>
      request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400));

    it('deve retornar 400 com campo obrigatorio faltando (sem email)', () =>
      request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Novo Usuario',
          phone: '11999999999',
          birthdate: '1990-01-01',
          cpf: '12345678901',
          rg: '1234567',
          rg_emissor: 'SSP-SP',
          address: {
            street: 'Rua das Flores',
            city: 'Sao Paulo',
            state: 'SP',
            number: '100',
            district: 'Centro',
            postal_code: '01310-100',
          },
        })
        .expect(400));

    it('deve retornar 400 com email invalido', () =>
      request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCreateUserWithAddressPayload, email: 'nao-e-um-email' })
        .expect(400));

    it('deve retornar 400 com campo nao permitido (forbidNonWhitelisted)', () =>
      request(app.getHttpServer())
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validCreateUserWithAddressPayload, campo_proibido: 'valor' })
        .expect(400));
  });

  describe('PUT /v1/users/me', () => {
    it('deve retornar 200 atualizando dados do usuario logado', async () => {
      const response = await request(app.getHttpServer())
        .put('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('PUT /v1/users/:id', () => {
    it('deve retornar 403 para usuario comum', () =>
      request(app.getHttpServer())
        .put('/v1/users/other-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Nome Atualizado' })
        .expect(403));

    it('deve retornar 200 para admin', async () => {
      const response = await request(app.getHttpServer())
        .put('/v1/users/user-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nome Atualizado' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    // Média prioridade: validação de input
    it('deve retornar 400 com campo nao permitido (forbidNonWhitelisted)', () =>
      request(app.getHttpServer())
        .put('/v1/users/user-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ campo_invalido: 'valor' })
        .expect(400));
  });

  // ── Alta Prioridade: PATCH /:id/toggle ───────────────────────────────────

  describe('PATCH /v1/users/:id/toggle', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).patch('/v1/users/user-1/toggle').expect(401));

    it('deve retornar 403 para usuario comum (apenas admin)', () =>
      request(app.getHttpServer())
        .patch('/v1/users/user-1/toggle')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));

    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .patch('/v1/users/user-1/toggle')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin com id valido', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/users/user-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.password).toBeUndefined();
    });
  });

  describe('DELETE /v1/users/:id', () => {
    it('deve retornar 403 para usuario comum', () =>
      request(app.getHttpServer())
        .delete('/v1/users/other-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .delete('/v1/users/user-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });
});
