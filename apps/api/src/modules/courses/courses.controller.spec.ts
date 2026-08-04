import { Test } from '@nestjs/testing';
import { DurationType } from '@repo/db';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { AppException } from '../../common/exceptions/app.exception';

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const userJwt = { userId: 'user-id-1', email: 'user@test.com', type: 'user' };

const makeReq = (user: typeof adminJwt) => ({ user }) as never;

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: jest.Mocked<CoursesService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: {
            findAll: jest.fn(),
            findByInstitutionName: jest.fn(),
            searchByName: jest.fn(),
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

    controller = module.get(CoursesController);
    service = module.get(CoursesService);
  });

  describe('rotas de leitura', () => {
    it('deve chamar findAll do service com o perfil do usuario', async () => {
      service.findAll.mockResolvedValue([]);
      await controller.findAll(makeReq(adminJwt));
      expect(service.findAll).toHaveBeenCalledWith('admin', undefined);
    });

    it('deve passar nome de instituicao pro service em findByInstitutionName', async () => {
      service.findByInstitutionName.mockResolvedValue([]);
      await controller.findByInstitutionName('Faculdade X');
      expect(service.findByInstitutionName).toHaveBeenCalledWith('Faculdade X');
    });

    it('deve buscar por id com falha se inexistente', async () => {
      service.findById.mockRejectedValue(new AppException('not-found'));
      await expect(controller.findById('1')).rejects.toMatchObject({ httpStatus: 404 });
    });
  });

  describe('rotas de escrita (admin)', () => {
    it('deve barrar criacao se nao for admin', async () => {
      await expect(
        controller.create(
          { name: 'C', duration: 1, duration_type: DurationType.MONTHS, category_id: '1' },
          makeReq(userJwt),
        ),
      ).rejects.toMatchObject({ httpStatus: 403 });
    });

    it('deve permitir criacao se for admin', async () => {
      service.create.mockResolvedValue({ id: '1' } as never);
      await controller.create(
        { name: 'C', duration: 1, duration_type: DurationType.MONTHS, category_id: '1' },
        makeReq(adminJwt),
      );
      expect(service.create).toHaveBeenCalled();
    });

    it('deve permitir update por admin', async () => {
      service.update.mockResolvedValue({ id: '1' } as never);
      await controller.update('1', { name: 'C2' }, makeReq(adminJwt));
      expect(service.update).toHaveBeenCalled();
    });

    it('deve permitir delete por admin', async () => {
      service.softDelete.mockResolvedValue({ id: '1' } as never);
      await controller.remove('1', makeReq(adminJwt));
      expect(service.softDelete).toHaveBeenCalled();
    });
  });
});
