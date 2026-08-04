import { Test } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

const ordersServiceMock = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findExpired: jest.fn(),
  findVoucher: jest.fn(),
  findPayments: jest.fn(),
  updateDefaulter: jest.fn(),
  changeScholarship: jest.fn(),
};

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersServiceMock }],
    }).compile();

    controller = module.get(OrdersController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });
});
