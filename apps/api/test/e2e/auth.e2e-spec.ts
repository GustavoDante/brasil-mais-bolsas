import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authServiceMock, createTestApp, validRegisterPayload } from './shared';
import { AppException } from '../../src/common/exceptions/app.exception';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    adminToken = tokens.adminToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/login', () => {
    it('deve retornar 401 com credenciais invalidas', () =>
      request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'naoexiste@test.com', password: '123456' })
        .expect(401));

    it('deve retornar 401 com email invalido', () =>
      request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'nao-e-email', password: '123456' })
        .expect(401));

    it('deve ignorar campo extra e retornar 201 com credenciais validas', () =>
      request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'admin@test.com', password: '123456', admin: true })
        .expect(201));

    it('deve retornar 201 com credenciais validas', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'admin@test.com', password: '123456' })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('admin@test.com');
    });

    it('deve retornar 429 apos excesso de tentativas (rate limit)', async () => {
      let gotRateLimit = false;

      for (let index = 0; index < 11; index += 1) {
        const response = await request(app.getHttpServer())
          .post('/v1/auth/login')
          .send({ email: 'naoexiste@test.com', password: '123456' });
        if (response.status === 429) {
          gotRateLimit = true;
          break;
        }
      }

      expect(gotRateLimit).toBe(true);
    });
  });

  describe('GET /v1/auth/me', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/auth/me').expect(401));

    it('deve retornar 200 com token valido e conter dados do usuario', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.userId).toBe('admin-1');
      expect(response.body.type).toBe('admin');
    });
  });

  describe('POST /v1/auth/register', () => {
    it('deve retornar 201 com token para payload valido', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(validRegisterPayload)
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(authServiceMock.register).toHaveBeenCalled();
    });

    it('deve retornar 400 sem endereco', () =>
      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ ...validRegisterPayload, address: undefined })
        .expect(400));

    it('deve retornar 400 com email invalido', () =>
      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ ...validRegisterPayload, email: 'nao-e-email' })
        .expect(400));

    it('deve retornar 400 com CPF fora do tamanho aceito', () =>
      request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ ...validRegisterPayload, cpf: '123' })
        .expect(400));

    it('deve rejeitar tentativa de se cadastrar como admin (campo type nao existe no DTO)', async () => {
      authServiceMock.register.mockClear();

      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ ...validRegisterPayload, type: 'admin' })
        .expect(400);

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });
  });

  describe('POST /v1/auth/forgot_password', () => {
    it('deve retornar 200 para e-mail cadastrado', () =>
      request(app.getHttpServer())
        .post('/v1/auth/forgot_password')
        .send({ email: 'admin@test.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true, message: 'password-reset-requested' });
        }));

    it('deve responder igual para e-mail inexistente (nao revela cadastro)', () =>
      request(app.getHttpServer())
        .post('/v1/auth/forgot_password')
        .send({ email: 'ninguem@test.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true, message: 'password-reset-requested' });
        }));

    it('deve retornar 400 para e-mail invalido', () =>
      request(app.getHttpServer())
        .post('/v1/auth/forgot_password')
        .send({ email: 'nao-e-email' })
        .expect(400));
  });

  describe('POST /v1/auth/password_reset', () => {
    const token = 'a'.repeat(64);

    it('deve retornar 200 com token e senhas validos', () =>
      request(app.getHttpServer())
        .post('/v1/auth/password_reset')
        .send({ token, password: 'SenhaNova123', repassword: 'SenhaNova123' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true, message: 'password-updated' });
        }));

    it('deve retornar 400 com senha curta demais', () =>
      request(app.getHttpServer())
        .post('/v1/auth/password_reset')
        .send({ token, password: '123', repassword: '123' })
        .expect(400));

    it('deve retornar 400 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/auth/password_reset')
        .send({ password: 'SenhaNova123', repassword: 'SenhaNova123' })
        .expect(400));

    it('deve propagar 400 quando o service recusa o token', async () => {
      authServiceMock.resetPassword.mockRejectedValueOnce(
        new AppException('token-not-found-or-expired'),
      );

      await request(app.getHttpServer())
        .post('/v1/auth/password_reset')
        .send({ token, password: 'SenhaNova123', repassword: 'SenhaNova123' })
        .expect(400);
    });
  });
});
