import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AsaasService } from '../../src/integrations/asaas/asaas.service';
import type {
  AsaasCustomerResponse,
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
} from '../../src/integrations/asaas/types/asaas.types';

const hasAsaas = Boolean(process.env.ASAAS_API_KEY && process.env.ASAAS_BASE_URL);

(hasAsaas ? describe : describe.skip)('Asaas integration (sandbox)', () => {
  let service: AsaasService;
  const externalRef = `test-${Date.now()}`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AsaasService,
        {
          provide: ConfigService,
          useValue: {
            get: (k: string) => {
              const val = process.env[k];
              if (!val && k === 'ASAAS_BASE_URL') return 'https://api-sandbox.asaas.com/v3';
              return val;
            },
          },
        },
      ],
    }).compile();

    service = module.get(AsaasService);
  }, 20000);

  it('should create a customer in sandbox', async () => {
    const customer: AsaasCustomerResponse = await service.createCustomer({
      name: 'Integration Test Customer',
      cpfCnpj: '00000000191',
      externalReference: externalRef,
    });

    expect(customer).toBeDefined();
    expect(customer.id).toBeTruthy();
  }, 20000);

  it('should create a PIX payment in sandbox and retrieve pixQrCode', async () => {
    const customer: AsaasCustomerResponse = await service.createCustomer({
      name: 'Payer',
      cpfCnpj: '00000000272',
      externalReference: `${externalRef}-pix`,
    });

    const created: AsaasPaymentResponse = await service.createPayment({
      customer: customer.id,
      billingType: 'PIX',
      value: 5,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    });

    expect(created).toBeDefined();
    const paymentId = created.id;
    expect(paymentId).toBeTruthy();

    const qr: AsaasPixQrCodeResponse = await service.getPixQrCode(paymentId);
    expect(qr).toBeDefined();
    expect(qr.payload).toBeTruthy();
  }, 40000);

  it('should create a BOLETO payment in sandbox', async () => {
    const customer: AsaasCustomerResponse = await service.createCustomer({
      name: 'Boleto Payer',
      cpfCnpj: '00000000353',
      externalReference: `${externalRef}-boleto`,
    });

    const boleto: AsaasPaymentResponse = await service.createPayment({
      customer: customer.id,
      billingType: 'BOLETO',
      value: 5,
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().substring(0, 10),
    });

    expect(boleto).toBeDefined();
    expect(boleto.id).toBeTruthy();
  }, 40000);

  it('should create a CREDIT_CARD payment in sandbox (success)', async () => {
    const customer: AsaasCustomerResponse = await service.createCustomer({
      name: 'Credit Card Payer',
      cpfCnpj: '00000000434',
      externalReference: `${externalRef}-cc-success`,
    });

    const payment: AsaasPaymentResponse = await service.createPayment({
      customer: customer.id,
      billingType: 'CREDIT_CARD',
      value: 10,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      creditCard: {
        holderName: 'HOLDER NAME',
        number: '4444444444444444',
        expiryMonth: '12',
        expiryYear: '2030',
        ccv: '123',
      },
      creditCardHolderInfo: {
        name: 'HOLDER NAME',
        email: 'test@example.com',
        cpfCnpj: '00000000434',
        postalCode: '01310100',
        addressNumber: '123',
        mobilePhone: '11999999999',
      },
      remoteIp: '127.0.0.1',
    });

    expect(payment).toBeDefined();
    expect(payment.id).toBeTruthy();
    expect(payment.status).toBeDefined();
  }, 40000);

  it('should fail to create a CREDIT_CARD payment in sandbox (error card)', async () => {
    const customer: AsaasCustomerResponse = await service.createCustomer({
      name: 'Credit Card Payer Fail',
      cpfCnpj: '00000000515',
      externalReference: `${externalRef}-cc-fail`,
    });

    await expect(
      service.createPayment({
        customer: customer.id,
        billingType: 'CREDIT_CARD',
        value: 10,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        creditCard: {
          holderName: 'HOLDER NAME',
          number: '5184019740373151',
          expiryMonth: '12',
          expiryYear: '2030',
          ccv: '123',
        },
        creditCardHolderInfo: {
          name: 'HOLDER NAME',
          email: 'test@example.com',
          cpfCnpj: '00000000515',
          postalCode: '01310100',
          addressNumber: '123',
          mobilePhone: '11999999999',
        },
        remoteIp: '127.0.0.1',
      }),
    ).rejects.toThrow();
  }, 40000);

  it('should throw BadRequestException for invalid customer data', async () => {
    await expect(
      service.createCustomer({
        name: 'Invalid',
        cpfCnpj: 'invalid',
        externalReference: 'invalid',
      }),
    ).rejects.toThrow();
  });

  it('should throw error when getting QR code for non-existent payment', async () => {
    await expect(service.getPixQrCode('pay_non_existent')).rejects.toThrow();
  });
});
