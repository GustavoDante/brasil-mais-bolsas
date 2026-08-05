import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ReportsService } from './reports.service';

const fixedNow = new Date('2024-06-01T00:00:00.000Z');

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    user: Record<string, jest.Mock>;
    order: Record<string, jest.Mock>;
    payment: Record<string, jest.Mock>;
    scholarship: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
      },
      order: {
        findFirst: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
      },
      scholarship: {
        findMany: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReportsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getStudents', () => {
    it('deve marcar toCall para admin quando não há pedidos', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'student-1',
          password: 'secret',
          email: 'student@test.com',
          phone: '999999999',
          delete: false,
          type: 'user',
          orders: [],
          partner: null,
          callsMade: [],
        },
      ]);

      const result = await service.getStudents({ userId: 'admin-1', type: 'admin' });

      expect(result).toHaveLength(1);
      expect(result[0].toCall).toBe(true);
    });

    it('deve filtrar pedidos por instituição do manager', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getStudents({ userId: 'manager-1', type: 'manager', institution_id: 'inst-1' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            orders: expect.objectContaining({
              where: { scholarship: { institution_id: 'inst-1' } },
            }),
          }),
        }),
      );
    });
  });

  describe('getCalled', () => {
    it('deve buscar apenas chamadas do usuário logado', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'student-1',
          password: 'secret',
          email: 'student@test.com',
          phone: '999999999',
          delete: false,
          type: 'user',
          orders: [],
          partner: null,
          callsMade: [{ id: 'call-1', to_return: false, caller: { id: 'admin-1', name: 'Admin' } }],
        },
      ]);

      const result = await service.getCalled({ userId: 'admin-1', type: 'admin' });

      expect(result).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            callsMade: { some: { caller_id: 'admin-1' } },
          }),
        }),
      );
    });
  });

  describe('getRenewals', () => {
    it('deve retornar apenas alunos dentro da janela de renovação', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'student-1',
          password: 'secret',
          email: 'student@test.com',
          phone: '999999999',
          delete: false,
          type: 'user',
          orders: [
            {
              id: 'order-1',
              expired: false,
              payments: [
                {
                  id: 'payment-1',
                  order_id: 'order-1',
                  status: 'PAID',
                  payment_type: 'BOLETO',
                  date_paid: new Date('2024-01-15T00:00:00.000Z'),
                },
              ],
            },
          ],
          partner: null,
          callsMade: [],
        },
      ]);

      const result = await service.getRenewals({ userId: 'admin-1', type: 'admin' }, { days: 60 });

      expect(result).toHaveLength(1);
      expect(result[0].daysUntilRenewal).toBeGreaterThanOrEqual(0);
      expect(result[0].order).not.toBeNull();
      expect(result[0].renewalDate).toBe('15/07/2024');
    });
  });

  describe('getPayments', () => {
    it('deve retornar pagamentos da ordem autenticada', async () => {
      prisma.order.findFirst.mockResolvedValue({
        payments: [{ id: 'payment-1' }, { id: 'payment-2' }],
      });

      const result = await service.getPayments('order-1', 'user-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 'order-1', user_id: 'user-1' },
        include: { payments: { orderBy: { created_at: 'desc' } } },
      });
      expect(result).toHaveLength(2);
    });

    it('deve lançar erro quando a ordem não existir', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.getPayments('order-1', 'user-1')).rejects.toMatchObject({
        httpStatus: 404,
      });
    });
  });
});
