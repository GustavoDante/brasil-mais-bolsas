import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { DurationType, type Course } from '@repo/db';
import { CoursesService } from './courses.service';

const mockCourse: Course = {
  id: 'course-1',
  name: 'Administração',
  duration: 8,
  duration_type: DurationType.MONTHS,
  category_id: 'cat-1',
  old_id: 'old_123',
  active: true,
  delete: false,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('CoursesService', () => {
  let service: CoursesService;
  let prisma: {
    course: Record<string, jest.Mock>;
    courseCategory: Record<string, jest.Mock>;
    institution: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      course: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      courseCategory: {
        findUnique: jest.fn(),
      },
      institution: {
        findFirst: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [CoursesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CoursesService);
  });

  describe('create', () => {
    it('deve criar um curso se categoria existir', async () => {
      prisma.courseCategory.findUnique.mockResolvedValue({ id: 'cat-1' });
      prisma.course.create.mockResolvedValue(mockCourse);

      const result = await service.create({
        name: 'Adm',
        duration: 8,
        duration_type: DurationType.MONTHS,
        category_id: 'cat-1',
      });
      expect(prisma.courseCategory.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(prisma.course.create).toHaveBeenCalled();
      expect(result).toEqual(mockCourse);
    });

    it('deve falhar se categoria nao existir', async () => {
      prisma.courseCategory.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          name: 'Adm',
          duration: 8,
          duration_type: DurationType.MONTHS,
          category_id: 'cat-1',
        }),
      ).rejects.toMatchObject({ httpStatus: 400 });
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os cursos para não-manager', async () => {
      prisma.course.findMany.mockResolvedValue([mockCourse]);
      await service.findAll('admin');
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { delete: false } }),
      );
    });

    it('deve retornar cursos atrelados a instituição para manager', async () => {
      prisma.course.findMany.mockResolvedValue([mockCourse]);
      await service.findAll('manager', 'inst-1');
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            delete: false,
            scholarships: { some: { institution_id: 'inst-1' } },
          },
        }),
      );
    });
  });

  describe('findByInstitutionName', () => {
    it('deve buscar instituição por nome ilike e então buscar cursos', async () => {
      prisma.institution.findFirst.mockResolvedValue({ id: 'inst-1' });
      prisma.course.findMany.mockResolvedValue([mockCourse]);

      await service.findByInstitutionName('Faculdade X');

      expect(prisma.institution.findFirst).toHaveBeenCalledWith({
        where: { name: { equals: 'Faculdade X', mode: 'insensitive' } },
      });
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scholarships: { some: { institution_id: 'inst-1' } },
          }),
        }),
      );
    });

    it('deve lançar erro se instituição não for encontrada', async () => {
      prisma.institution.findFirst.mockResolvedValue(null);
      await expect(service.findByInstitutionName('Inexistente')).rejects.toMatchObject({ httpStatus: 404 });
    });
  });

  describe('update', () => {
    it('deve validar categoria antes de atualizar', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.courseCategory.findUnique.mockResolvedValue(null);

      await expect(service.update('id', { category_id: 'cat-2' })).rejects.toMatchObject({ httpStatus: 400 });
    });

    it('deve atualizar curso corretamente', async () => {
      prisma.course.findUnique.mockResolvedValue(mockCourse);
      prisma.course.update.mockResolvedValue(mockCourse);

      await service.update('id', { name: 'Novo' });
      expect(prisma.course.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ name: 'Novo' }) }),
      );
    });
  });
});
