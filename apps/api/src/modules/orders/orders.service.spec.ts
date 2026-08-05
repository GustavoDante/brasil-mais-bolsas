import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OrdersService } from './orders.service';

type ModelMock = Record<string, jest.Mock>;

const adminUser = { userId: 'admin-1', email: 'admin@test.com', type: 'admin' };
const regularUser = { userId: 'user-1', email: 'user@test.com', type: 'user' };
const managerUser = { userId: 'manager-1', email: 'manager@test.com', type: 'manager' };

const order = {
  id: 'order-1',
  user_id: 'user-1',
  scholarship_id: 'scholarship-1',
  code: 100001,
  expired: false,
  is_renew: false,
  defaulter: false,
  scholarship: { institution_id: 'institution-1' },
  payments: [{ id: 'payment-1', status: 'PAID' }],
};

const scholarship = {
  id: 'scholarship-1',
  final_price: 500,
  full_price: 1000,
  discount: 50,
  quantity_offered: 10,
};

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    user: ModelMock;
    scholarship: ModelMock;
    order: ModelMock;
    payment: ModelMock;
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      scholarship: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      order: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      payment: { updateMany: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('create', () => {
    it('deve criar pedido quando usuario e bolsa existirem', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.scholarship.findFirst.mockResolvedValue({ id: 'scholarship-1' });
      prisma.order.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ code: 100000 });
      prisma.order.create.mockResolvedValue(order);

      const result = await service.create({
        user_id: 'user-1',
        scholarship_id: 'scholarship-1',
      });

      expect(result).toEqual({ ok: true, message: 'order-created' });
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 100001 }),
        }),
      );
    });

    it('deve falhar quando ja existir pedido aberto', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.scholarship.findFirst.mockResolvedValue({ id: 'scholarship-1' });
      prisma.order.findFirst.mockResolvedValue(order);

      await expect(
        service.create({ user_id: 'user-1', scholarship_id: 'scholarship-1' }),
      ).rejects.toMatchObject({ httpStatus: 400 });
    });
  });

  describe('findAll', () => {
    it('deve restringir usuario comum aos proprios pedidos', async () => {
      prisma.order.findMany.mockResolvedValue([order]);

      // `page`/`limit` tem `.default()` no schema, entao chegam sempre preenchidos ao
      // service. Chamar com `{}` aqui testaria uma entrada que o pipe nunca produz.
      await service.findAll(regularUser, { page: 1, limit: 20 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1' },
        }),
      );
    });

    it('deve restringir manager a instituicao vinculada', async () => {
      prisma.user.findUnique.mockResolvedValue({ institution_id: 'institution-1' });
      prisma.order.findMany.mockResolvedValue([order]);

      await service.findAll(managerUser, { page: 1, limit: 20 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scholarship: { institution_id: 'institution-1' } },
        }),
      );
    });
  });

  describe('findById', () => {
    it('deve retornar pedido quando usuario for dono', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findById('order-1', regularUser);

      expect(result.id).toBe('order-1');
    });

    it('deve bloquear usuario comum acessando pedido de outro usuario', async () => {
      prisma.order.findUnique.mockResolvedValue({ ...order, user_id: 'other-user' });

      await expect(service.findById('order-1', regularUser)).rejects.toMatchObject({
        httpStatus: 403,
      });
    });

    it('deve falhar quando pedido nao existir', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing', adminUser)).rejects.toMatchObject({
        httpStatus: 404,
      });
    });
  });

  describe('changeScholarship', () => {
    it('deve trocar bolsa e atualizar pagamentos vinculados', async () => {
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.scholarship.findUnique
        .mockResolvedValueOnce(scholarship)
        .mockResolvedValueOnce({ ...scholarship, id: 'scholarship-2', discount: 60 });
      prisma.order.update.mockResolvedValue({ ...order, scholarship_id: 'scholarship-2' });
      prisma.order.count.mockResolvedValue(3);

      const result = await service.changeScholarship({
        orderId: 'order-1',
        newScholarshipId: 'scholarship-2',
      });

      expect(result.scholarship_id).toBe('scholarship-2');
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { order_id: 'order-1' },
          data: expect.objectContaining({ scholarship_id: 'scholarship-2' }),
        }),
      );
    });
  });

  describe('updateDefaulter', () => {
    it('deve atualizar inadimplencia para admin', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await service.updateDefaulter(adminUser, {
        order_id: 'order-1',
        defaulter: true,
      });

      expect(result.message).toBe('Pedido marcado como inadimplente');
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { defaulter: true },
      });
    });
  });

  describe('getOrCreateOpenOrder', () => {
    it('deve reutilizar pedido aberto existente', async () => {
      prisma.order.findFirst.mockResolvedValue(order);

      const result = await service.getOrCreateOpenOrder('user-1', 'scholarship-1', false);

      expect(result).toBe(order);
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });
});
