import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { IndicationsService } from './indications.service';

describe('IndicationsService', () => {
  let service: IndicationsService;

  const mockPrisma = {
    indication: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    indicationCall: {
      updateMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndicationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<IndicationsService>(IndicationsService);
    module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if duplicate found', async () => {
      mockPrisma.indication.findFirst.mockResolvedValue({ id: '1' });
      await expect(
        service.create('u1', { name: 'n', email: 'e', cell: 'c', city: 'ct' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create indication if no duplicate', async () => {
      mockPrisma.indication.findFirst.mockResolvedValue(null);
      mockPrisma.indication.create.mockResolvedValue({ id: '1' });
      const res = await service.create('u1', { name: 'n', email: 'e', cell: 'c', city: 'ct' });
      expect(res.id).toBe('1');
    });
  });

  describe('createCall', () => {
    it('should throw NotFoundException if indication does not exist', async () => {
      mockPrisma.indication.findUnique.mockResolvedValue(null);

      await expect(
        service.createCall('caller1', {
          indication_id: 'missing',
          description: 'd',
        }),
      ).rejects.toThrow('indication-not-found');
    });

    it('should update previous calls if to_return is false', async () => {
      mockPrisma.indication.findUnique.mockResolvedValue({ id: 'i1', delete: false });
      mockPrisma.indicationCall.create.mockResolvedValue({ id: 'c1' });
      await service.createCall('caller1', {
        indication_id: 'i1',
        description: 'd',
        to_return: false,
      });
      expect(mockPrisma.indicationCall.updateMany).toHaveBeenCalledWith({
        where: { indication_id: 'i1' },
        data: { to_return: false },
      });
    });
  });
});
