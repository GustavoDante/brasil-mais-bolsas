import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CreateNewScholarshipValueDto, CreateScholarshipDto } from './dto/scholarships.dto';
import { ScholarshipsController, type AuthenticatedRequest } from './scholarships.controller';
import { ScholarshipsService } from './scholarships.service';

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const managerJwt = {
  userId: 'manager-id',
  email: 'manager@test.com',
  type: 'manager',
  institution_id: 'inst-1',
};
const userJwt = { userId: 'user-id', email: 'user@test.com', type: 'user' };

const makeReq = (user: AuthenticatedRequest['user']): AuthenticatedRequest => ({ user });

describe('ScholarshipsController', () => {
  let controller: ScholarshipsController;
  let service: jest.Mocked<ScholarshipsService>;
  type ScholarshipRecord = Awaited<ReturnType<ScholarshipsService['create']>>;

  const createScholarshipMock = { id: '1' } as unknown as ScholarshipRecord;
  const updateScholarshipMock = { id: '1' } as unknown as Awaited<
    ReturnType<ScholarshipsService['update']>
  >;
  const toggleScholarshipMock = { id: '1' } as unknown as Awaited<
    ReturnType<ScholarshipsService['toggleActive']>
  >;
  const createNewValueMock = { id: '2' } as unknown as ScholarshipRecord;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ScholarshipsController],
      providers: [
        {
          provide: ScholarshipsService,
          useValue: {
            create: jest.fn(),
            findAllForManager: jest.fn(),
            listRandom: jest.fn(),
            listOrder: jest.fn(),
            searchCity: jest.fn(),
            listCity: jest.fn(),
            searchInstitution: jest.fn(),
            listInstitutionByCity: jest.fn(),
            listCourseByCity: jest.fn(),
            searchCourse: jest.fn(),
            getIndexList: jest.fn(),
            listBackoffice: jest.fn(),
            getContractInfo: jest.fn(),
            findById: jest.fn(),
            getStudentsCount: jest.fn(),
            changeOrderScholarship: jest.fn(),
            findByOldId: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            toggleActive: jest.fn(),
            listAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ScholarshipsController);
    service = module.get(ScholarshipsService);
  });

  describe('Rotas de leitura públicas', () => {
    it('deve buscar cidades', async () => {
      service.searchCity.mockResolvedValue([]);
      const res = await controller.searchCity('SP');
      expect(service.searchCity).toHaveBeenCalledWith('SP');
      expect(res.cities).toEqual([]);
    });

    it('deve listar para manager (findAll)', async () => {
      service.findAllForManager.mockResolvedValue([]);
      await controller.findAll(makeReq(managerJwt));
      expect(service.findAllForManager).toHaveBeenCalledWith('inst-1');
    });

    it('deve listar para admin (findAll) sem restrição de institution', async () => {
      service.findAllForManager.mockResolvedValue([]);
      await controller.findAll(makeReq(adminJwt));
      expect(service.findAllForManager).toHaveBeenCalledWith(undefined);
    });

    it('deve listar random', async () => {
      service.listRandom.mockResolvedValue([]);
      await controller.listRandom({});
      expect(service.listRandom).toHaveBeenCalled();
    });
  });

  describe('Rotas de restrição (Backoffice)', () => {
    it('deve falhar listBackoffice para user', async () => {
      await expect(controller.listBackoffice(makeReq(userJwt), {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve permitir listBackoffice para manager', async () => {
      service.listBackoffice.mockResolvedValue([]);
      await controller.listBackoffice(makeReq(managerJwt), {});
      expect(service.listBackoffice).toHaveBeenCalled();
    });
  });

  describe('Rotas de escrita (Admin)', () => {
    it('deve barrar criacao se nao for admin', async () => {
      await expect(
        controller.create({} as CreateScholarshipDto, makeReq(managerJwt)),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve permitir criacao se for admin', async () => {
      service.create.mockResolvedValue(createScholarshipMock);
      await controller.create({} as CreateScholarshipDto, makeReq(adminJwt));
      expect(service.create).toHaveBeenCalled();
    });

    it('deve permitir update por admin', async () => {
      service.update.mockResolvedValue(updateScholarshipMock);
      await controller.update('1', {}, makeReq(adminJwt));
      expect(service.update).toHaveBeenCalled();
    });

    it('deve permitir toggle por admin', async () => {
      service.toggleActive.mockResolvedValue(toggleScholarshipMock);
      await controller.toggleActive('1', makeReq(adminJwt));
      expect(service.toggleActive).toHaveBeenCalled();
    });

    it('deve alterar valor da bolsa e setar antiga para inactive (new_value)', async () => {
      service.update.mockResolvedValue(updateScholarshipMock);
      service.create.mockResolvedValue(createNewValueMock);
      await controller.createNewValue(
        { scholarship_id: '1' } as CreateNewScholarshipValueDto,
        makeReq(adminJwt),
      );
      expect(service.update).toHaveBeenCalledWith('1', { active: false });
      expect(service.create).toHaveBeenCalled();
    });
  });
});
