import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { CourseCategory } from '@repo/db';
import { CourseCategoriesService } from './course-categories.service';

const mockCategory: CourseCategory = {
  id: 'cat-1',
  name: 'Graduação',
  old_id: 'old_123',
  order: 1,
  active: true,
  delete: false,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('CourseCategoriesService', () => {
  let service: CourseCategoriesService;
  let prisma: {
    courseCategory: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      courseCategory: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [CourseCategoriesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CourseCategoriesService);
  });

  describe('create', () => {
    it('deve criar uma categoria', async () => {
      prisma.courseCategory.create.mockResolvedValue(mockCategory);
      const result = await service.create({ name: 'Graduação' });
      expect(prisma.courseCategory.create).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as categorias ativas', async () => {
      prisma.courseCategory.findMany.mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(prisma.courseCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { delete: false }, orderBy: { order: 'asc' } }),
      );
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('update', () => {
    it('deve lancar erro se nao achar', async () => {
      prisma.courseCategory.findUnique.mockResolvedValue(null);
      await expect(service.update('id', {})).rejects.toMatchObject({ httpStatus: 404 });
    });

    it('deve atualizar categoria', async () => {
      prisma.courseCategory.findUnique.mockResolvedValue(mockCategory);
      prisma.courseCategory.update.mockResolvedValue(mockCategory);
      await service.update('cat-1', { name: 'Pós' });
      expect(prisma.courseCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'Pós' } }),
      );
    });
  });

  describe('softDelete e toggleActive', () => {
    it('deve fazer soft delete', async () => {
      prisma.courseCategory.findUnique.mockResolvedValue(mockCategory);
      await service.softDelete('id');
      expect(prisma.courseCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { delete: true, active: false } }),
      );
    });

    it('deve alternar status ativo', async () => {
      prisma.courseCategory.findUnique.mockResolvedValue(mockCategory);
      await service.toggleActive('id');
      expect(prisma.courseCategory.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { active: false } }),
      );
    });
  });
});
