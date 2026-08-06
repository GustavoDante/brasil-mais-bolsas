import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, institutionsServiceMock, validCreateInstitutionPayload } from './shared';

const pngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(256, 1),
]);

const pdfBuffer = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(256, 1)]);

/** Envia o payload da instituicao como campos de formulario (multipart) */
const withInstitutionFields = (req: request.Test): request.Test =>
  Object.entries(validCreateInstitutionPayload).reduce(
    (acc, [key, value]) => acc.field(key, String(value)),
    req,
  );

describe('Institutions (e2e)', () => {
  let app: INestApplication;
  let adminToken = '';
  let managerToken = '';
  let staleManagerToken = '';

  beforeAll(async () => {
    const { app: testApp, tokens } = await createTestApp();
    app = testApp;
    adminToken = tokens.adminToken;
    managerToken = tokens.managerToken;
    staleManagerToken = tokens.staleManagerToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/institutions', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/institutions').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/institutions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('deve repassar o institution_id do gestor para o service', async () => {
      institutionsServiceMock.findAll.mockClear();

      await request(app.getHttpServer())
        .get('/v1/institutions')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(institutionsServiceMock.findAll).toHaveBeenCalledWith(
        'manager',
        'manager-1',
        'institution-1',
      );
    });

    it('deve repassar undefined para gestor com token anterior a claim', async () => {
      institutionsServiceMock.findAll.mockClear();

      await request(app.getHttpServer())
        .get('/v1/institutions')
        .set('Authorization', `Bearer ${staleManagerToken}`)
        .expect(200);

      // O service devolve `[]` nesse caso. Comportamento esperado durante a janela de
      // migração — some assim que o `JWT_SECRET` for rotacionado e o gestor logar de novo.
      expect(institutionsServiceMock.findAll).toHaveBeenCalledWith(
        'manager',
        'manager-1',
        undefined,
      );
    });
  });

  describe('GET /v1/institutions/search', () => {
    it('deve retornar 200 com token e parametro de busca', () =>
      request(app.getHttpServer())
        .get('/v1/institutions/search?term=fac')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/institutions/search?term=fac').expect(401));
  });

  describe('GET /v1/institutions/search/by_city', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/institutions/search/by_city?term=sao').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/institutions/search/by_city?term=sao')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('GET /v1/institutions/id/:id', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/institutions/id/institution-1').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/institutions/id/institution-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('GET /v1/institutions/old_id/:oldId', () => {
    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer()).get('/v1/institutions/old_id/legacy-1').expect(401));

    it('deve retornar 200 com token', () =>
      request(app.getHttpServer())
        .get('/v1/institutions/old_id/legacy-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('POST /v1/institutions', () => {
    it('deve retornar 403 para manager (apenas admin)', () =>
      request(app.getHttpServer())
        .post('/v1/institutions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateInstitutionPayload)
        .expect(403));

    it('deve retornar 201 para admin', () =>
      request(app.getHttpServer())
        .post('/v1/institutions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateInstitutionPayload)
        .expect(201));

    it('deve retornar 401 sem token', () =>
      request(app.getHttpServer())
        .post('/v1/institutions')
        .send(validCreateInstitutionPayload)
        .expect(401));

    it('deve aceitar multipart com a logo no campo image e repassar o arquivo', async () => {
      institutionsServiceMock.create.mockClear();

      await withInstitutionFields(
        request(app.getHttpServer())
          .post('/v1/institutions')
          .set('Authorization', `Bearer ${adminToken}`),
      )
        .attach('image', pngBuffer, { filename: 'logo.png', contentType: 'image/png' })
        .expect(201);

      const [, file] = institutionsServiceMock.create.mock.calls[0];
      expect(file).toEqual(expect.objectContaining({ fieldname: 'image', mimetype: 'image/png' }));
    });

    it('deve retornar 400 quando a logo nao e uma imagem (PDF)', () =>
      withInstitutionFields(
        request(app.getHttpServer())
          .post('/v1/institutions')
          .set('Authorization', `Bearer ${adminToken}`),
      )
        .attach('image', pdfBuffer, { filename: 'contrato.pdf', contentType: 'application/pdf' })
        .expect(400));

    it('deve retornar 400 quando o arquivo tem extensao incompativel com o conteudo', () =>
      withInstitutionFields(
        request(app.getHttpServer())
          .post('/v1/institutions')
          .set('Authorization', `Bearer ${adminToken}`),
      )
        .attach('image', pngBuffer, { filename: 'shell.php', contentType: 'image/png' })
        .expect(400));
  });

  describe('PUT /v1/institutions/:id', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .put('/v1/institutions/institution-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validCreateInstitutionPayload)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .put('/v1/institutions/institution-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCreateInstitutionPayload)
        .expect(200));

    it('deve aceitar troca da logo via multipart', async () => {
      institutionsServiceMock.update.mockClear();

      await request(app.getHttpServer())
        .put('/v1/institutions/institution-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Faculdade Renomeada')
        .attach('image', pngBuffer, { filename: 'logo.png', contentType: 'image/png' })
        .expect(200);

      const [id, , file] = institutionsServiceMock.update.mock.calls[0];
      expect(id).toBe('institution-1');
      expect(file).toEqual(expect.objectContaining({ fieldname: 'image' }));
    });
  });

  describe('DELETE /v1/institutions/:id', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .delete('/v1/institutions/institution-1')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .delete('/v1/institutions/institution-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  describe('PATCH /v1/institutions/:id/toggle', () => {
    it('deve retornar 403 para manager', () =>
      request(app.getHttpServer())
        .patch('/v1/institutions/institution-1/toggle')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403));

    it('deve retornar 200 para admin', () =>
      request(app.getHttpServer())
        .patch('/v1/institutions/institution-1/toggle')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });
});
