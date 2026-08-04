import { Test } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

const mockPaymentsService = {
  createCreditCardPayment: jest.fn().mockResolvedValue({
    ok: true,
    message: 'payment-created',
    status: 'CONFIRMED',
  }),
  createInterestPayment: jest.fn().mockResolvedValue({
    ok: true,
    message: 'interest-payment-created-successfully',
    paymentId: 'payment-1',
  }),
  createPixPayment: jest.fn().mockResolvedValue({
    ok: true,
    message: 'pix-payment-created',
  }),
};

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    }).compile();

    controller = module.get(PaymentsController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });
});
