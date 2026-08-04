import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FaqService } from './faq.service';

describe('FaqService', () => {
  let service: FaqService;
  let prisma: {
    faq: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      faq: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [FaqService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(FaqService);
  });

  it('deve criar uma faq', async () => {
    prisma.faq.create.mockResolvedValue({ id: 'faq-1' });

    const result = await service.create({ question: 'Q?', answer: 'A' });

    expect(result).toEqual({ id: 'faq-1' });
  });

  it('deve retornar erro quando faq não existir', async () => {
    prisma.faq.findUnique.mockResolvedValue(null);

    await expect(service.findOne('faq-1')).rejects.toMatchObject({ httpStatus: 404 });
  });
});
