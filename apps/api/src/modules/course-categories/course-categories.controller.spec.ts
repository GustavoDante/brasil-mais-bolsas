import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CourseCategoriesController } from './course-categories.controller';
import { CourseCategoriesService } from './course-categories.service';

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const userJwt = { userId: 'user-id-1', email: 'user@test.com', type: 'user' };

const makeReq = (user: typeof adminJwt) => ({ user }) as never;

describe('CourseCategoriesController', () => {
  let controller: CourseCategoriesController;
  let service: jest.Mocked<CourseCategoriesService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CourseCategoriesController],
      providers: [
        {
          provide: CourseCategoriesService,
          useValue: {
            findAll: jest.fn(),
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

    controller = module.get(CourseCategoriesController);
    service = module.get(CourseCategoriesService);
  });

  describe('rotas de leitura', () => {
    it('deve retornar todas categorias', async () => {
      service.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result.courseCategories).toEqual([]);
    });

    it('deve lancar erro se nao achar por id', async () => {
      service.findById.mockRejectedValue(new NotFoundException());
      await expect(controller.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rotas restritas (admin)', () => {
    it('deve barrar criacao por user', async () => {
      await expect(controller.create({ name: 'cat' }, makeReq(userJwt))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve permitir criacao por admin', async () => {
      service.create.mockResolvedValue({ id: '1' } as never);
      await controller.create({ name: 'cat' }, makeReq(adminJwt));
      expect(service.create).toHaveBeenCalled();
    });

    it('deve permitir update por admin', async () => {
      service.update.mockResolvedValue({ id: '1' } as never);
      await controller.update('1', { name: 'cat2' }, makeReq(adminJwt));
      expect(service.update).toHaveBeenCalled();
    });

    it('deve permitir delete por admin', async () => {
      service.softDelete.mockResolvedValue({ id: '1' } as never);
      await controller.remove('1', makeReq(adminJwt));
      expect(service.softDelete).toHaveBeenCalled();
    });

    it('deve permitir toggle por admin', async () => {
      service.toggleActive.mockResolvedValue({ id: '1' } as never);
      await controller.toggle('1', makeReq(adminJwt));
      expect(service.toggleActive).toHaveBeenCalled();
    });
  });
});
