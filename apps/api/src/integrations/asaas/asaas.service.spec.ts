import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AsaasService } from './asaas.service';

describe('AsaasService', () => {
  let service: AsaasService;
  let configService: { get: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'ASAAS_API_KEY') return 'test-key';
        if (key === 'ASAAS_BASE_URL') return 'https://asaas.test/v3';
        return undefined;
      }),
    };

    fetchMock = jest.fn();
    global.fetch = fetchMock;

    const module = await Test.createTestingModule({
      providers: [AsaasService, { provide: ConfigService, useValue: configService }],
    }).compile();

    service = module.get(AsaasService);
  });

  it('deve criar cliente chamando o endpoint do Asaas', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'cus_123', name: 'Cliente', cpfCnpj: '123' }),
    });

    const result = await service.createCustomer({
      name: 'Cliente',
      cpfCnpj: '12345678901',
      externalReference: 'user-1',
    });

    expect(result.id).toBe('cus_123');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://asaas.test/v3/customers',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ access_token: 'test-key' }),
      }),
    );
  });

  it('deve criar pagamento com cartao de credito chamando o endpoint do Asaas', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'pay_123', status: 'PENDING' }),
    });

    const result = await service.createPayment({
      customer: 'cus_123',
      billingType: 'CREDIT_CARD',
      value: 100,
      dueDate: '2026-05-17',
      creditCard: {
        holderName: 'HOLDER',
        number: '4444',
        expiryMonth: '12',
        expiryYear: '2030',
        ccv: '123',
      },
      creditCardHolderInfo: {
        name: 'HOLDER',
        email: 'test@test.com',
        cpfCnpj: '12345678901',
        postalCode: '01310100',
        addressNumber: '123',
        mobilePhone: '11999999999',
      },
    });

    expect(result.id).toBe('pay_123');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://asaas.test/v3/payments',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"billingType":"CREDIT_CARD"'),
      }),
    );
  });

  it('deve falhar quando a chave da API nao estiver configurada', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'ASAAS_BASE_URL' ? 'https://asaas.test/v3' : undefined,
    );
    const module = await Test.createTestingModule({
      providers: [AsaasService, { provide: ConfigService, useValue: configService }],
    }).compile();
    const serviceWithoutKey = module.get(AsaasService);

    await expect(
      serviceWithoutKey.createPayment({
        customer: 'cus_123',
        billingType: 'PIX',
        value: 100,
        dueDate: '2026-05-14',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
