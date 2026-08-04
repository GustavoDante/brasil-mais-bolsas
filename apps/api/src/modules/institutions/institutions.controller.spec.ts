import { Test } from '@nestjs/testing';
import type { UploadedFileData } from '../../common/types/uploaded-file.type';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { AppException } from '../../common/exceptions/app.exception';

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const userJwt = { userId: 'user-id-1', email: 'user@test.com', type: 'user' };

const imageFile: UploadedFileData = {
  fieldname: 'image',
  originalname: 'logo.png',
  encoding: '7bit',
  mimetype: 'image/png',
  size: 40,
  buffer: Buffer.alloc(40),
};

const makeReq = (user: typeof adminJwt) => ({ user }) as never;

describe('InstitutionsController', () => {
  let controller: InstitutionsController;
  let service: jest.Mocked<InstitutionsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [InstitutionsController],
      providers: [
        {
          provide: InstitutionsService,
          useValue: {
            findAll: jest.fn(),
            searchByName: jest.fn(),
            searchByCity: jest.fn(),
            findById: jest.fn(),
            findByOldId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            toggleActive: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(InstitutionsController);
    service = module.get(InstitutionsService);
  });

  describe('findAll e search', () => {
    it('deve chamar service.findAll com dados do usuario', async () => {
      service.findAll.mockResolvedValue([]);
      await controller.findAll(makeReq(adminJwt));
      expect(service.findAll).toHaveBeenCalledWith('admin', 'admin-id', undefined);
    });

    it('deve pesquisar por nome', async () => {
      service.searchByName.mockResolvedValue([]);
      await controller.search('termo');
      expect(service.searchByName).toHaveBeenCalledWith('termo');
    });

    it('deve pesquisar por cidade retornando objeto esperado', async () => {
      service.searchByCity.mockResolvedValue([]);
      const result = await controller.searchByCity('termo');
      expect(service.searchByCity).toHaveBeenCalledWith('termo');
      expect(result).toHaveProperty('courses');
    });
  });

  describe('find by id', () => {
    it('deve retornar institution se existir', async () => {
      service.findById.mockResolvedValue({ id: '1' } as never);
      const res = await controller.findById('1');
      expect(res.institution.id).toBe('1');
    });

    it('deve lancar AppException 404 se nao existir', async () => {
      service.findById.mockResolvedValue(null);
      await expect(controller.findById('1')).rejects.toMatchObject({ httpStatus: 404 });
    });
  });

  describe('rotas admin (create, update, toggle, delete)', () => {
    it('deve permitir create para admin', async () => {
      service.create.mockResolvedValue({ id: '1' } as never);
      await controller.create({} as never, makeReq(adminJwt));
      expect(service.create).toHaveBeenCalled();
    });

    it('deve barrar create para user', async () => {
      await expect(controller.create({} as never, makeReq(userJwt))).rejects.toMatchObject({ httpStatus: 403 });
    });

    it('deve repassar o arquivo de imagem para o service no create', async () => {
      service.create.mockResolvedValue({ id: '1' } as never);
      await controller.create({} as never, makeReq(adminJwt), imageFile);
      expect(service.create).toHaveBeenCalledWith({}, imageFile);
    });

    it('deve permitir update para admin', async () => {
      service.update.mockResolvedValue({ id: '1' } as never);
      await controller.update('1', {}, makeReq(adminJwt));
      expect(service.update).toHaveBeenCalled();
    });

    it('deve repassar o arquivo de imagem para o service no update', async () => {
      service.update.mockResolvedValue({ id: '1' } as never);
      await controller.update('1', {}, makeReq(adminJwt), imageFile);
      expect(service.update).toHaveBeenCalledWith('1', {}, imageFile);
    });

    it('deve permitir toggle para admin', async () => {
      service.toggleActive.mockResolvedValue({ id: '1' } as never);
      await controller.toggle('1', makeReq(adminJwt));
      expect(service.toggleActive).toHaveBeenCalled();
    });

    it('deve permitir delete para admin', async () => {
      service.softDelete.mockResolvedValue({ id: '1' } as never);
      await controller.remove('1', makeReq(adminJwt));
      expect(service.softDelete).toHaveBeenCalled();
    });
  });
});
