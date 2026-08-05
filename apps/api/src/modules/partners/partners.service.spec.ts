import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PartnersService } from './partners.service';

const mockPrisma = {
  partner: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  access: {
    create: jest.fn(),
  },
};

describe('PartnersService', () => {
  let service: PartnersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartnersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PartnersService>(PartnersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw AppException 400 if code exists', async () => {
      mockPrisma.partner.findFirst.mockResolvedValueOnce({ id: '1' });
      await expect(service.create({ name: 'x', code: 'x', password: '123' })).rejects.toMatchObject(
        { httpStatus: 400 },
      );
    });

    it('should create partner if code is new', async () => {
      mockPrisma.partner.findFirst.mockResolvedValueOnce(null);
      mockPrisma.partner.create.mockResolvedValueOnce({ id: '2' });
      const result = await service.create({ name: 'x', code: 'x', password: '123' });
      expect(result).toEqual({ id: '2' });
    });
  });
});
