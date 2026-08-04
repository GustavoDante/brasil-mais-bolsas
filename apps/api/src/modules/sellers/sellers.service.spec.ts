import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SellersService } from './sellers.service';
import { AppException } from '../../common/exceptions/app.exception';

const mockPrisma = {
  seller: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('SellersService', () => {
  let service: SellersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SellersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SellersService>(SellersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw AppException 400 if email exists', async () => {
      mockPrisma.seller.findFirst.mockResolvedValueOnce({ id: '1' });
      await expect(
        service.create({ name: 'x', email: 'x@x.com', password: '123' }),
      ).rejects.toMatchObject({ httpStatus: 400 });
    });

    it('should create seller if email is new', async () => {
      mockPrisma.seller.findFirst.mockResolvedValueOnce(null);
      mockPrisma.seller.create.mockResolvedValueOnce({ id: '2' });
      const result = await service.create({ name: 'x', email: 'x@x.com', password: '123' });
      expect(result).toEqual({ id: '2' });
    });
  });
});
