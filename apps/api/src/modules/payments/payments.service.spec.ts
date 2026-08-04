import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import { MailService } from '../../integrations/mail/mail.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PaymentType } from '@repo/db';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from './payments.service';
import { AppException } from '../../common/exceptions/app.exception';

type ModelMock = Record<string, jest.Mock>;

const mockUser = {
  id: 'user-1',
  name: 'Usuario Teste',
  email: 'user@test.com',
  cpf: '12345678901',
  phone: '11999999999',
  whatsapp_phone: null,
  birthdate: new Date('1990-01-01'),
  address: {
    street: 'Rua A',
    number: '100',
    district: 'Centro',
    postal_code: '01000-000',
    complement: null,
  },
  client: { id: 'cus_123' },
};

const mockScholarship = {
  id: 'scholarship-1',
  full_price: 1000,
  final_price: 500,
  discount: 50,
};

const mockOrder = {
  id: 'order-1',
  code: 100001,
  user_id: 'user-1',
  scholarship_id: 'scholarship-1',
  expired: false,
  is_renew: false,
  defaulter: false,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockPayment = {
  id: 'payment-1',
  status: 'PENDING',
  payment_type: PaymentType.CREDIT_CARD,
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    user: ModelMock;
    scholarship: ModelMock;
    externalClient: ModelMock;
    order: ModelMock;
    payment: ModelMock;
  };
  let asaasService: {
    createCustomer: jest.Mock;
    createPayment: jest.Mock;
    getPixQrCode: jest.Mock;
  };
  let configService: { get: jest.Mock };
  let ordersService: { getOrCreateOpenOrder: jest.Mock };
  let mailService: { sendPaymentConfirmed: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      scholarship: { findFirst: jest.fn() },
      externalClient: { create: jest.fn() },
      order: { findFirst: jest.fn(), create: jest.fn() },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    mailService = {
      sendPaymentConfirmed: jest.fn().mockResolvedValue({ sent: true }),
    };
    asaasService = {
      createCustomer: jest.fn(),
      createPayment: jest.fn(),
      getPixQrCode: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => (key === 'ASAAS_WEBHOOK_TOKEN' ? 'webhook-token' : undefined)),
    };
    ordersService = {
      getOrCreateOpenOrder: jest.fn().mockResolvedValue(mockOrder),
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.scholarship.findFirst.mockResolvedValue(mockScholarship);
    prisma.payment.create.mockResolvedValue(mockPayment);
    prisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'CONFIRMED' });

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AsaasService, useValue: asaasService },
        { provide: ConfigService, useValue: configService },
        { provide: OrdersService, useValue: ordersService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  describe('createCreditCardPayment', () => {
    it('deve criar cobranca no Asaas e atualizar o pagamento local', async () => {
      asaasService.createPayment.mockResolvedValue({
        id: 'pay_123',
        status: 'CONFIRMED',
        value: 500,
        billingType: 'CREDIT_CARD',
        invoiceUrl: 'https://invoice.test',
      });

      const result = await service.createCreditCardPayment('user-1', {
        scholarship_id: 'scholarship-1',
        installment_count: 1,
        creditCard: {
          holderName: 'USUARIO TESTE',
          number: '5162306219378829',
          expiryMonth: '05',
          expiryYear: '2028',
          ccv: '318',
        },
        creditCardHolderInfo: {
          name: 'Usuario Teste',
          email: 'user@test.com',
          cpfCnpj: '12345678901',
          postalCode: '01000-000',
          addressNumber: '100',
          mobilePhone: '11999999999',
        },
        remoteIp: '203.0.113.10',
      });

      expect(result.ok).toBe(true);
      expect(asaasService.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          billingType: 'CREDIT_CARD',
          customer: 'cus_123',
          externalReference: 'payment-1',
          remoteIp: '203.0.113.10',
        }),
      );
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: expect.objectContaining({ gateway_payment_id: 'pay_123', status: 'CONFIRMED' }),
        }),
      );
    });

    it('deve marcar o pagamento como FAILED quando o Asaas falhar', async () => {
      asaasService.createPayment.mockRejectedValue(new AppException('asaas-rejected'));

      await expect(
        service.createCreditCardPayment('user-1', {
          scholarship_id: 'scholarship-1',
          creditCard: {
            holderName: 'USUARIO TESTE',
            number: '5162306219378829',
            expiryMonth: '05',
            expiryYear: '2028',
            ccv: '318',
          },
          creditCardHolderInfo: {
            name: 'Usuario Teste',
            email: 'user@test.com',
            cpfCnpj: '12345678901',
            postalCode: '01000-000',
            addressNumber: '100',
            mobilePhone: '11999999999',
          },
          remoteIp: '203.0.113.10',
        }),
      ).rejects.toMatchObject({ httpStatus: 400 });

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: { status: 'FAILED' },
      });
    });
  });

  describe('createInterestPayment', () => {
    it('deve impedir duplicidade de pagamento de interesse', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: 'payment-existing' });

      await expect(
        service.createInterestPayment('user-1', { scholarship_id: 'scholarship-1' }),
      ).rejects.toMatchObject({ httpStatus: 400 });
    });

    it('deve criar pagamento de interesse com cobranca PIX no Asaas', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      asaasService.createPayment.mockResolvedValue({
        id: 'pay_interest_123',
        status: 'PENDING',
        value: 500,
        billingType: 'PIX',
        invoiceUrl: 'https://invoice.test',
      });
      asaasService.getPixQrCode.mockResolvedValue({
        encodedImage: 'base64',
        payload: 'pix-copy-and-paste',
        expirationDate: '2026-05-15T00:00:00.000Z',
      });

      const result = await service.createInterestPayment('user-1', {
        scholarship_id: 'scholarship-1',
      });

      expect(result.paymentId).toBe('payment-1');
      expect(asaasService.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({ billingType: 'PIX', customer: 'cus_123' }),
      );
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ payment_type: PaymentType.INTEREST }),
        }),
      );
    });
  });

  describe('createPixPayment', () => {
    it('deve criar cobranca PIX e retornar QR Code', async () => {
      asaasService.createPayment.mockResolvedValue({
        id: 'pay_pix_123',
        status: 'PENDING',
        value: 500,
        billingType: 'PIX',
        invoiceUrl: 'https://invoice.test',
      });
      asaasService.getPixQrCode.mockResolvedValue({
        encodedImage: 'base64',
        payload: 'pix-copy-and-paste',
        expirationDate: '2026-05-15T00:00:00.000Z',
      });

      const result = await service.createPixPayment('user-1', {
        scholarship_id: 'scholarship-1',
      });

      expect(result.pixQrCode.payload).toBe('pix-copy-and-paste');
      expect(asaasService.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({ billingType: 'PIX', customer: 'cus_123' }),
      );
      expect(asaasService.getPixQrCode).toHaveBeenCalledWith('pay_pix_123');
    });
  });

  describe('handleAsaasWebhook', () => {
    it('deve rejeitar token invalido', async () => {
      await expect(
        service.handleAsaasWebhook('token-invalido', {
          event: 'PAYMENT_CONFIRMED',
          payment: {
            id: 'pay_123',
            status: 'CONFIRMED',
            billingType: 'PIX',
          },
        }),
      ).rejects.toMatchObject({ code: 'invalid-asaas-webhook-token' });
    });

    it('deve atualizar status do pagamento pelo gateway_payment_id', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: 'payment-1', date_paid: null });

      const result = await service.handleAsaasWebhook('webhook-token', {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_123',
          status: 'CONFIRMED',
          billingType: 'PIX',
        },
      });

      expect(result.message).toBe('asaas-webhook-processed');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: {
          status: 'CONFIRMED',
          date_paid: expect.any(Date),
        },
      });
    });
  });
});
