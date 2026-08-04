import { SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { OrdersRenewalService } from './orders-renewal/orders-renewal.service';
import { AppException } from '../common/exceptions/app.exception';

const adminRequest = { user: { userId: 'admin-1', email: 'admin@test.com', type: 'admin' } };
const managerRequest = { user: { userId: 'manager-1', email: 'm@test.com', type: 'manager' } };

const summary = {
  started_at: '2026-07-31T06:00:00.000Z',
  finished_at: '2026-07-31T06:00:01.000Z',
  duration_ms: 1000,
  scanned: 2,
  renewed: 1,
  skipped: 1,
  failed: 0,
  items: [],
};

const cronJob = {
  cronTime: { source: '0 3 * * *' },
  isActive: true,
  lastExecution: new Date('2026-07-30T06:00:00.000Z'),
  nextDate: () => ({ toISO: () => '2026-08-01T03:00:00.000-03:00' }),
};

describe('JobsController', () => {
  let controller: JobsController;
  let ordersRenewalService: { run: jest.Mock };

  beforeEach(async () => {
    ordersRenewalService = { run: jest.fn().mockResolvedValue(summary) };

    const moduleRef = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        { provide: OrdersRenewalService, useValue: ordersRenewalService },
        {
          provide: SchedulerRegistry,
          useValue: { getCronJobs: () => new Map([['orders-renewal', cronJob]]) },
        },
      ],
    }).compile();

    controller = moduleRef.get(JobsController);
  });

  describe('list', () => {
    it('deve listar os agendamentos registrados para admin', () => {
      const result = controller.list(adminRequest);

      expect(result.ok).toBe(true);
      expect(result.jobs).toEqual([
        expect.objectContaining({
          name: 'orders-renewal',
          cron_time: '0 3 * * *',
          active: true,
          next_run: '2026-08-01T03:00:00.000-03:00',
          last_run: '2026-07-30T06:00:00.000Z',
        }),
      ]);
    });

    it('deve negar acesso para quem nao e admin', () => {
      expect(() => controller.list(managerRequest)).toThrow(AppException);
    });
  });

  describe('runOrdersRenewal', () => {
    it('deve executar a renovacao e devolver o resumo', async () => {
      const result = await controller.runOrdersRenewal(adminRequest);

      expect(ordersRenewalService.run).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true, summary });
    });

    it('deve negar execucao para quem nao e admin', async () => {
      await expect(controller.runOrdersRenewal(managerRequest)).rejects.toMatchObject({ httpStatus: 403 });
      expect(ordersRenewalService.run).not.toHaveBeenCalled();
    });
  });
});
