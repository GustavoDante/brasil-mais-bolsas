import { Test } from '@nestjs/testing';
import type { CheckoutInput } from '@repo/contracts';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthService } from '../auth/auth.service';
import { PaymentsService } from '../payments/payments.service';
import { CheckoutService } from './checkout.service';

const customer: NonNullable<CheckoutInput['customer']> = {
  name: 'Usuario Teste',
  email: 'user@test.com',
  phone: '11999999999',
  birthdate: '1990-01-01',
  cpf: '12345678901',
  rg: '123456789',
  rg_emissor: 'SSP',
  address: {
    street: 'Rua A',
    number: '100',
    district: 'Centro',
    city: 'Sao Paulo',
    state: 'SP',
    postal_code: '01000-000',
  },
};

const pixCheckout: CheckoutInput = {
  scholarship_id: 'scholarship-1',
  customer,
  payment: { method: 'PIX', installment_count: 1 },
  accepted_terms: true,
};

const chargeResult = {
  payment: { id: 'payment-1' },
  charge: { method: 'PIX' as const, status: 'PENDING' },
};

describe('CheckoutService', () => {
  let service: CheckoutService;
  let authService: { register: jest.Mock };
  let paymentsService: { createCharge: jest.Mock };

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue({
        accessToken: 'token-novo',
        user: { id: 'user-novo', email: 'user@test.com' },
      }),
    };
    paymentsService = {
      createCharge: jest.fn().mockResolvedValue(chargeResult),
    };

    const module = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: AuthService, useValue: authService },
        { provide: PaymentsService, useValue: paymentsService },
      ],
    }).compile();

    service = module.get(CheckoutService);
  });

  describe('visitante', () => {
    it('deve criar o usuario e devolver o token da sessao junto da cobranca', async () => {
      const result = await service.checkout(undefined, pixCheckout);

      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@test.com', register_scholarship: 'scholarship-1' }),
      );
      expect(paymentsService.createCharge).toHaveBeenCalledWith('user-novo', {
        scholarship_id: 'scholarship-1',
        method: 'PIX',
        renew: false,
      });
      expect(result.checkout.accessToken).toBe('token-novo');
      expect(result.message).toBe('checkout-created');
    });

    it('deve recusar quando nao ha sessao nem dados de cadastro', async () => {
      await expect(
        service.checkout(undefined, { ...pixCheckout, customer: undefined }),
      ).rejects.toMatchObject({ code: 'invalid-user' });

      expect(paymentsService.createCharge).not.toHaveBeenCalled();
    });

    it('deve propagar o conflito de e-mail sem chamar o gateway', async () => {
      authService.register.mockRejectedValue(new AppException('email-already-taken'));

      await expect(service.checkout(undefined, pixCheckout)).rejects.toMatchObject({
        code: 'email-already-taken',
        httpStatus: 409,
      });
      expect(paymentsService.createCharge).not.toHaveBeenCalled();
    });
  });

  describe('usuario autenticado', () => {
    const sessionUser = { userId: 'user-1', email: 'logado@test.com', type: 'user' };

    it('deve usar o usuario do token e ignorar o customer do corpo', async () => {
      const result = await service.checkout(sessionUser, pixCheckout);

      expect(authService.register).not.toHaveBeenCalled();
      expect(paymentsService.createCharge).toHaveBeenCalledWith('user-1', expect.anything());
      expect(result.checkout.accessToken).toBeUndefined();
    });
  });

  describe('formas de pagamento', () => {
    const sessionUser = { userId: 'user-1', email: 'logado@test.com', type: 'user' };

    const creditCardCheckout: CheckoutInput = {
      scholarship_id: 'scholarship-1',
      payment: {
        method: 'CREDIT_CARD',
        installment_count: 6,
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
      },
      accepted_terms: true,
    };

    it('deve repassar os dados do cartao, o parcelamento e o IP da requisicao', async () => {
      await service.checkout(sessionUser, creditCardCheckout, '203.0.113.10');

      expect(paymentsService.createCharge).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          method: 'CREDIT_CARD',
          installment_count: 6,
          remoteIp: '203.0.113.10',
        }),
      );
    });

    it('deve preferir o IP da requisicao ao que veio no corpo', async () => {
      await service.checkout(
        sessionUser,
        {
          ...creditCardCheckout,
          payment: { ...creditCardCheckout.payment, remoteIp: '198.51.100.7' },
        },
        '203.0.113.10',
      );

      expect(paymentsService.createCharge).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ remoteIp: '203.0.113.10' }),
      );
    });

    it('deve recusar o cartao quando nao ha IP nenhum para o antifraude', async () => {
      await expect(service.checkout(sessionUser, creditCardCheckout)).rejects.toMatchObject({
        code: 'validation-error',
      });
    });

    it('deve tratar o boleto como cobranca a vista', async () => {
      await service.checkout(sessionUser, {
        scholarship_id: 'scholarship-1',
        payment: { method: 'BOLETO', installment_count: 1 },
        accepted_terms: true,
      });

      expect(paymentsService.createCharge).toHaveBeenCalledWith('user-1', {
        scholarship_id: 'scholarship-1',
        method: 'BOLETO',
        renew: false,
      });
    });
  });
});
