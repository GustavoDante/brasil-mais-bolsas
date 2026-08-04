import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import { OrdersRenewalService } from './orders-renewal.service';

type ModelMock = Record<string, jest.Mock>;

const candidate = {
  id: 'order-1',
  user_id: 'user-1',
  scholarship_id: 'scholarship-1',
  user: { name: 'Maria Silva' },
  scholarship: { full_price: '1000.00' },
};

const paymentLink = {
  id: 'pay_link_1',
  name: 'Maria Silva',
  url: 'https://asaas.com/l/pay_link_1',
  active: true,
  billingType: 'UNDEFINED' as const,
  chargeType: 'INSTALLMENT' as const,
};

describe('OrdersRenewalService', () => {
  let service: OrdersRenewalService;
  let prisma: { order: ModelMock; payment: ModelMock; $transaction: jest.Mock };
  let asaas: { createPaymentLink: jest.Mock };
  let env: Record<string, string>;

  beforeEach(async () => {
    env = {};
    prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'order-renewal-1', code: 100001 }),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      payment: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    asaas = { createPaymentLink: jest.fn().mockResolvedValue(paymentLink) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersRenewalService,
        { provide: PrismaService, useValue: prisma },
        { provide: AsaasService, useValue: asaas },
        { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
      ],
    }).compile();

    service = moduleRef.get(OrdersRenewalService);
  });

  describe('configuração', () => {
    it('deve usar os valores padrao herdados da API antiga', () => {
      expect(service.getOptions()).toEqual({
        triggerDays: 180,
        graceDays: 7,
        percent: 30,
        maxInstallments: 4,
        dueDateLimitDays: 3,
      });
    });

    it('deve ignorar variavel de ambiente invalida e manter o padrao', async () => {
      env = { ORDERS_RENEWAL_PERCENT: 'abc' };
      const moduleRef = await Test.createTestingModule({
        providers: [
          OrdersRenewalService,
          { provide: PrismaService, useValue: prisma },
          { provide: AsaasService, useValue: asaas },
          { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
        ],
      }).compile();

      expect(moduleRef.get(OrdersRenewalService).getOptions().percent).toBe(30);
    });
  });

  describe('run', () => {
    it('deve buscar apenas pedidos ativos com pagamento dentro da janela de renovacao', async () => {
      const reference = new Date('2026-01-31T03:00:00.000Z');
      await service.run(reference);

      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.expired).toBe(false);

      const range = where.payments.some.created_at;
      const days = (date: Date) => Math.round((reference.getTime() - date.getTime()) / 86_400_000);
      expect(where.payments.some.status).toBe('PAID');
      expect(days(range.lte)).toBe(180);
      expect(days(range.gte)).toBe(187);
    });

    it('deve renovar o pedido criando pedido, link de pagamento e pagamento WAITING', async () => {
      prisma.order.findMany.mockResolvedValue([candidate]);

      const summary = await service.run();

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 'user-1',
            scholarship_id: 'scholarship-1',
            is_renew: true,
            expired: false,
            code: 100000,
          }),
        }),
      );

      expect(asaas.createPaymentLink).toHaveBeenCalledWith({
        name: 'Maria Silva',
        value: 300,
        dueDateLimitDays: 3,
        chargeType: 'INSTALLMENT',
        billingType: 'UNDEFINED',
        externalReference: 'order-renewal-1',
        maxInstallmentCount: 4,
      });

      const paymentData = prisma.payment.create.mock.calls[0][0].data;
      expect(paymentData).toEqual(
        expect.objectContaining({
          status: 'WAITING',
          payment_type: 'UNDEFINED',
          gateway_payment_id: 'pay_link_1',
          url_boleto: paymentLink.url,
          full_price: '1000.00',
          final_price: '300.00',
          discount: '70.00',
          renew: true,
        }),
      );

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { expired: true },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(summary).toEqual(
        expect.objectContaining({ scanned: 1, renewed: 1, skipped: 0, failed: 0 }),
      );
    });

    it('deve pular quando o aluno ja tem renovacao aguardando pagamento', async () => {
      prisma.order.findMany.mockResolvedValue([candidate]);
      prisma.order.findFirst.mockResolvedValue({ id: 'order-renewal-existente' });

      const summary = await service.run();

      expect(asaas.createPaymentLink).not.toHaveBeenCalled();
      expect(prisma.order.create).not.toHaveBeenCalled();
      expect(summary.skipped).toBe(1);
      expect(summary.items[0]).toEqual(
        expect.objectContaining({ outcome: 'skipped', reason: 'renovacao-pendente' }),
      );
    });

    it('deve falhar sem cobrar quando a bolsa nao tem valor', async () => {
      prisma.order.findMany.mockResolvedValue([
        { ...candidate, scholarship: { full_price: null } },
      ]);

      const summary = await service.run();

      expect(asaas.createPaymentLink).not.toHaveBeenCalled();
      expect(summary.failed).toBe(1);
      expect(summary.items[0].reason).toBe('bolsa-sem-valor');
    });

    it('deve remover o pedido de renovacao quando o gateway falha', async () => {
      prisma.order.findMany.mockResolvedValue([candidate]);
      asaas.createPaymentLink.mockRejectedValue(new Error('asaas indisponivel'));

      const summary = await service.run();

      expect(prisma.order.delete).toHaveBeenCalledWith({ where: { id: 'order-renewal-1' } });
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(summary.failed).toBe(1);
      expect(summary.items[0].reason).toBe('asaas indisponivel');
    });

    it('nao deve interromper os demais pedidos quando um falha', async () => {
      prisma.order.findMany.mockResolvedValue([candidate, { ...candidate, id: 'order-2' }]);
      asaas.createPaymentLink
        .mockRejectedValueOnce(new Error('asaas indisponivel'))
        .mockResolvedValueOnce(paymentLink);

      const summary = await service.run();

      expect(summary).toEqual(
        expect.objectContaining({ scanned: 2, renewed: 1, failed: 1, skipped: 0 }),
      );
    });

    it('deve retornar resumo vazio quando nao ha pedidos na janela', async () => {
      const summary = await service.run();

      expect(summary).toEqual(
        expect.objectContaining({ scanned: 0, renewed: 0, skipped: 0, failed: 0, items: [] }),
      );
      expect(asaas.createPaymentLink).not.toHaveBeenCalled();
    });
  });
});
