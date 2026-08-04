import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { GeneralReportQueryDto, RenewalsReportQueryDto } from './dto/reports.dto';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const managerJwt = {
  userId: 'manager-id',
  email: 'manager@test.com',
  type: 'manager',
  institution_id: 'inst-1',
};
const userJwt = { userId: 'user-id', email: 'user@test.com', type: 'user' };

const makeReq = (user: typeof adminJwt | typeof managerJwt | typeof userJwt) => ({ user }) as never;

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<ReportsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            getStudents: jest.fn(),
            getCalled: jest.fn(),
            getToCall: jest.fn(),
            getRenewals: jest.fn(),
            getDefaulters: jest.fn(),
            getGeneralReport: jest.fn(),
            getPayments: jest.fn(),
            getImpactReport: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ReportsController);
    service = module.get(ReportsService);
  });

  describe('getStudents', () => {
    it('deve retornar relatório para admin', async () => {
      service.getStudents.mockResolvedValue([{ id: 'student-1' }] as never);

      const result = await controller.getStudents(makeReq(adminJwt));

      expect(result).toEqual({ ok: true, students: [{ id: 'student-1' }] });
      expect(service.getStudents).toHaveBeenCalledWith({
        userId: 'admin-id',
        type: 'admin',
        institution_id: undefined,
      });
    });

    it('deve bloquear user comum', async () => {
      await expect(controller.getStudents(makeReq(userJwt))).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCalled', () => {
    it('deve retornar alunos chamados pelo admin', async () => {
      service.getCalled.mockResolvedValue([{ id: 'student-1' }] as never);

      const result = await controller.getCalled(makeReq(adminJwt));

      expect(result.ok).toBe(true);
      expect(service.getCalled).toHaveBeenCalledWith({
        userId: 'admin-id',
        type: 'admin',
        institution_id: undefined,
      });
    });

    it('deve bloquear manager', async () => {
      await expect(controller.getCalled(makeReq(managerJwt))).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getRenewals', () => {
    it('deve retornar renovações para manager', async () => {
      service.getRenewals.mockResolvedValue([{ id: 'student-1', daysUntilRenewal: 10 }] as never);
      const query: RenewalsReportQueryDto = { days: 15 };

      const result = await controller.getRenewals(query, makeReq(managerJwt));

      expect(result.ok).toBe(true);
      expect(service.getRenewals).toHaveBeenCalledWith(
        {
          userId: 'manager-id',
          type: 'manager',
          institution_id: 'inst-1',
        },
        query,
      );
    });

    it('deve bloquear user comum', async () => {
      const query: RenewalsReportQueryDto = { days: 15 };
      await expect(controller.getRenewals(query, makeReq(userJwt))).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getGeneralReport', () => {
    it('deve bloquear user comum', async () => {
      const query: GeneralReportQueryDto = {
        institution: 'all',
        course: 'all',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      await expect(controller.getGeneralReport(query, makeReq(userJwt))).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getPayments', () => {
    it('deve retornar pagamentos da ordem autenticada', async () => {
      service.getPayments.mockResolvedValue([{ id: 'payment-1' }] as never);

      const result = await controller.getPayments('order-1', makeReq(userJwt));

      expect(result).toEqual({ ok: true, payments: [{ id: 'payment-1' }] });
      expect(service.getPayments).toHaveBeenCalledWith('order-1', 'user-id');
    });

    it('deve rejeitar quando order_id não for enviado', async () => {
      await expect(controller.getPayments(undefined, makeReq(userJwt))).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getImpactReport', () => {
    it('deve exigir instituição para admin', async () => {
      await expect(controller.getImpactReport('', makeReq(adminJwt))).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
