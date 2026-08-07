import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import type { CheckoutInput } from '@repo/contracts';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

const checkoutResult = {
  ok: true,
  message: 'checkout-created',
  checkout: { payment: { id: 'payment-1' }, charge: { method: 'PIX', status: 'PENDING' } },
};

const dto: CheckoutInput = {
  scholarship_id: 'scholarship-1',
  payment: { method: 'PIX', installment_count: 1 },
  accepted_terms: true,
};

describe('CheckoutController', () => {
  let controller: CheckoutController;
  const checkoutService = { checkout: jest.fn().mockResolvedValue(checkoutResult) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [{ provide: CheckoutService, useValue: checkoutService }],
    }).compile();

    controller = module.get(CheckoutController);
  });

  it('deve repassar o usuario do token e o IP da requisicao', async () => {
    const req = {
      user: { userId: 'user-1', email: 'user@test.com', type: 'user' },
      ip: '203.0.113.10',
    } as Request & { user: JwtUser };

    await controller.checkout(req, dto);

    expect(checkoutService.checkout).toHaveBeenCalledWith(req.user, dto, '203.0.113.10');
  });

  it('deve aceitar requisicao sem sessao — o guard opcional nao popula req.user', async () => {
    const req = { ip: '203.0.113.10' } as Request & { user?: JwtUser };

    const result = await controller.checkout(req, dto);

    expect(checkoutService.checkout).toHaveBeenCalledWith(undefined, dto, '203.0.113.10');
    expect(result.message).toBe('checkout-created');
  });
});
