import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@repo/db';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { CreateScholarshipDto } from './dto/scholarships.dto';
import { ScholarshipsService } from './scholarships.service';

const mockScholarship = {
  id: 'sch-1',
  shift: 'Manhã',
  type: 'PRESENCIAL',
  full_price: new Prisma.Decimal(1000),
  discount: new Prisma.Decimal(50),
  final_price: new Prisma.Decimal(500),
  quantity_offered: 10,
  renovation_days: 30,
  register_period_start: new Date(),
  course_id: 'course-1',
  institution_id: 'inst-1',
  active: true,
  delete: false,
  expired: false,
};

describe('ScholarshipsService', () => {
  let service: ScholarshipsService;
  let prisma: {
    scholarship: Record<string, jest.Mock>;
    institution: Record<string, jest.Mock>;
    course: Record<string, jest.Mock>;
    payment: Record<string, jest.Mock>;
    signedContract: Record<string, jest.Mock>;
    order: Record<string, jest.Mock>;
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      scholarship: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      institution: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      course: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      payment: {
        count: jest.fn(),
        updateMany: jest.fn(),
      },
      signedContract: {
        findFirst: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [ScholarshipsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ScholarshipsService);
  });

  describe('create', () => {
    it('deve falhar se instituição for inválida', async () => {
      prisma.institution.findUnique.mockResolvedValue(null);
      await expect(service.create({ institution_id: '1' } as CreateScholarshipDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve falhar se curso for inválido', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: 'inst-1' });
      prisma.course.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ institution_id: 'inst-1', course_id: 'course-1' } as CreateScholarshipDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar scholarship', async () => {
      prisma.institution.findUnique.mockResolvedValue({ id: 'inst-1' });
      prisma.course.findUnique.mockResolvedValue({ id: 'course-1' });
      prisma.scholarship.create.mockResolvedValue(mockScholarship);

      const res = await service.create({
        institution_id: 'inst-1',
        course_id: 'course-1',
        full_price: 1000,
        discount: 50,
      } as CreateScholarshipDto);

      expect(prisma.scholarship.create).toHaveBeenCalled();
      expect(res.id).toBe('sch-1');
    });
  });

  describe('findAllForManager', () => {
    it('deve listar para manager', async () => {
      prisma.scholarship.findMany.mockResolvedValue([mockScholarship]);
      const res = await service.findAllForManager('inst-1');
      expect(prisma.scholarship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { delete: false, expired: false, institution_id: 'inst-1' },
        }),
      );
      expect(res).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('deve falhar se nao existir', async () => {
      prisma.scholarship.findUnique.mockResolvedValue(null);
      await expect(service.update('sch-1', {})).rejects.toThrow(NotFoundException);
    });

    it('deve atualizar o scholarship e setar expired baseado na qtd', async () => {
      prisma.scholarship.findUnique.mockResolvedValue(mockScholarship);
      prisma.payment.count.mockResolvedValue(10); // Mesma qtd ofertada (10)
      prisma.scholarship.update.mockResolvedValue(mockScholarship);

      await service.update('sch-1', { full_price: 2000 });

      expect(prisma.scholarship.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expired: true }),
        }),
      );
    });
  });

  describe('changeOrderScholarship', () => {
    it('deve falhar se order ou scholarship nao existir', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.changeOrderScholarship({ order_id: '1', new_scholarship: '2' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve alterar valores dos payments atrelados a ordem', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1' });
      prisma.scholarship.findUnique.mockResolvedValue(mockScholarship);
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await service.changeOrderScholarship({ order_id: 'order-1', new_scholarship: 'sch-1' });

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { order_id: 'order-1' },
        data: {
          final_price: mockScholarship.final_price,
          discount: mockScholarship.discount,
          full_price: mockScholarship.full_price,
        },
      });
    });
  });

  describe('listOrder e listAll', () => {
    it('deve executar listOrder corretamente', async () => {
      prisma.scholarship.findMany.mockResolvedValue([
        { ...mockScholarship, _count: { payments: 2 } },
      ]);
      const res = await service.listOrder({ type: 'PRESENCIAL' });
      expect(prisma.scholarship.findMany).toHaveBeenCalled();
      expect(res[0].payments_count).toBe(2);
    });
  });
});
