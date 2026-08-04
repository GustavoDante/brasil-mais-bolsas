import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, uploadsServiceMock } from './shared';

/** PNG valido minimo: assinatura + preenchimento para passar do tamanho minimo */
const pngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(256, 1),
]);

const pdfBuffer = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(256, 1)]);

describe('Uploads (e2e)', () => {
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

  describe('POST /v1/uploads', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/uploads')
        .attach('file', pngBuffer, { filename: 'logo.png', contentType: 'image/png' })
        .expect(401));

    it('deve retornar 201 com a URL do arquivo enviado', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', pngBuffer, { filename: 'logo.png', contentType: 'image/png' })
        .expect(201);

      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('content_type', 'image/png');
      expect(uploadsServiceMock.upload).toHaveBeenCalled();
    });

    it('deve aceitar PDF', () =>
      request(app.getHttpServer())
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('folder', 'contracts')
        .attach('file', pdfBuffer, { filename: 'contrato.pdf', contentType: 'application/pdf' })
        .expect(201));

    it('deve retornar 400 quando nenhum arquivo e enviado', () =>
      request(app.getHttpServer())
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('folder', 'misc')
        .expect(400));

    it('deve retornar 400 para conteudo que nao e um tipo suportado', () =>
      request(app.getHttpServer())
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('<?php system($_GET["cmd"]); ?>0123456789'), {
          filename: 'shell.png',
          contentType: 'image/png',
        })
        .expect(400));

    it('deve retornar 400 quando o content-type nao corresponde ao conteudo', () =>
      request(app.getHttpServer())
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', pngBuffer, { filename: 'logo.gif', contentType: 'image/gif' })
        .expect(400));

    it('deve retornar 400 para pasta fora da lista permitida', () =>
      request(app.getHttpServer())
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('folder', '../../secrets')
        .attach('file', pngBuffer, { filename: 'logo.png', contentType: 'image/png' })
        .expect(400));

    it('deve retornar 400 para campo de arquivo com nome inesperado', () =>
      request(app.getHttpServer())
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('arquivo', pngBuffer, { filename: 'logo.png', contentType: 'image/png' })
        .expect(400));
  });

  describe('DELETE /v1/uploads', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .delete('/v1/uploads')
        .query({ key: 'misc/2026/07/2f1c4a1e-6c2e-4a3b-9d51-1a2b3c4d5e6f.png' })
        .expect(401));

    it('deve retornar 403 para usuario comum', () =>
      request(app.getHttpServer())
        .delete('/v1/uploads')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ key: 'misc/2026/07/2f1c4a1e-6c2e-4a3b-9d51-1a2b3c4d5e6f.png' })
        .expect(403));

    it('deve retornar 200 para admin com key valida', () =>
      request(app.getHttpServer())
        .delete('/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ key: 'misc/2026/07/2f1c4a1e-6c2e-4a3b-9d51-1a2b3c4d5e6f.png' })
        .expect(200));

    it('deve retornar 400 para key fora do formato gerado pelo upload', () =>
      request(app.getHttpServer())
        .delete('/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ key: '../../backups/dump.sql' })
        .expect(400));
  });
});
