import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CallsService } from './calls.service';

const mockCall = {
  id: 'call-1',
  caller_id: 'admin-1',
  receiver_id: 'user-1',
  description: 'Descrição',
  to_return: false,
};

describe('CallsService', () => {
  let service: CallsService;
  let prisma: {
    user: Record<string, jest.Mock>;
    call: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      call: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [CallsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CallsService);
  });

  it('deve criar um chamado quando o receiver existir', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', name: 'User 1' });
    prisma.call.create.mockResolvedValue(mockCall);

    const result = await service.create('admin-1', {
      receiver_id: 'user-1',
      description: 'Descrição',
    });

    expect(prisma.call.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Object) }),
    );
    expect(result).toEqual(mockCall);
  });

  it('deve rejeitar quando receiver não existir', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.create('admin-1', { receiver_id: 'user-1', description: 'Descrição' }),
    ).rejects.toMatchObject({ httpStatus: 400 });
  });

  it('deve buscar chamado por id e lançar erro quando não existir', async () => {
    prisma.call.findUnique.mockResolvedValue(null);

    await expect(service.findOne('call-1')).rejects.toMatchObject({ httpStatus: 404 });
  });

  it('deve remover chamado existente', async () => {
    prisma.call.findUnique.mockResolvedValue(mockCall);
    prisma.call.delete.mockResolvedValue(mockCall);

    const result = await service.remove('call-1');

    expect(result).toEqual(mockCall);
  });
});
