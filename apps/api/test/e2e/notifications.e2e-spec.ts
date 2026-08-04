import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, validCreateNotificationPayload } from './shared';

describe('Notifications (e2e)', () => {
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

  describe('POST /v1/notifications', () => {
    it('deve criar notificação para admin -> 201', () =>
      request(app.getHttpServer())
        .post('/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateNotificationPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('notification-created');
        }));
  });

  describe('GET /v1/notifications', () => {
    it('deve listar notificações do usuário logado -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.ok).toBe(true);
          expect(Array.isArray(res.body.notifications)).toBe(true);
        }));
  });

  describe('GET /v1/notifications/:id', () => {
    it('deve buscar notificação por id -> 200', () =>
      request(app.getHttpServer())
        .get('/v1/notifications/notification-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200));
  });

  describe('PATCH /v1/notifications/:id', () => {
    it('deve atualizar notificação para admin -> 200', () =>
      request(app.getHttpServer())
        .patch('/v1/notifications/notification-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Novo título' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('notification-updated');
        }));
  });

  describe('PATCH /v1/notifications/:id/read', () => {
    it('deve marcar notificação como lida -> 200', () =>
      request(app.getHttpServer())
        .patch('/v1/notifications/notification-1/read')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('notification-read');
        }));
  });

  describe('DELETE /v1/notifications/:id', () => {
    it('deve remover notificação como admin -> 200', () =>
      request(app.getHttpServer())
        .delete('/v1/notifications/notification-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('notification-deleted');
        }));
  });
});
