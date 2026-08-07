import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

const mockPaymentsService = {
  createCreditCardPayment: jest.fn().mockResolvedValue({
    ok: true,
    message: 'payment-created',
    status: 'CONFIRMED',
  }),
  createBoletoPayment: jest.fn().mockResolvedValue({
    ok: true,
    message: 'boleto-payment-created',
  }),
  createPixPayment: jest.fn().mockResolvedValue({
    ok: true,
    message: 'pix-payment-created',
  }),
  findOwnPayment: jest.fn().mockResolvedValue({ id: 'payment-1', status: 'CONFIRMED' }),
};

const authenticatedRequest = {
  user: { userId: 'user-1', email: 'user@test.com', type: 'user' },
} as Request & { user: JwtUser };

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    }).compile();

    controller = module.get(PaymentsController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve delegar a criacao do boleto ao service com o usuario do token', async () => {
    await controller.createBoletoPayment(authenticatedRequest, {
      scholarship_id: 'scholarship-1',
    });

    expect(mockPaymentsService.createBoletoPayment).toHaveBeenCalledWith('user-1', {
      scholarship_id: 'scholarship-1',
    });
  });

  it('deve devolver o pagamento do proprio usuario no envelope padrao', async () => {
    const result = await controller.findOne(authenticatedRequest, 'payment-1');

    expect(mockPaymentsService.findOwnPayment).toHaveBeenCalledWith('user-1', 'payment-1');
    expect(result).toEqual({ ok: true, payment: { id: 'payment-1', status: 'CONFIRMED' } });
  });
});
