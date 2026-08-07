import { Injectable } from '@nestjs/common';
import type { Payment } from '@repo/db';
import type { CheckoutCharge, CheckoutInput } from '@repo/contracts';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthService } from '../auth/auth.service';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { PaymentsService, type CreateChargeInput } from '../payments/payments.service';

/**
 * O `payment` sai como model do Prisma (`Decimal`, `Date`), não como o `CheckoutResult` do
 * contrato: o contrato descreve o **formato wire**, em que o `Decimal` já virou string pela
 * serialização JSON. É a mesma divisão dos DTOs de resposta dos outros módulos.
 */
type CheckoutServiceResult = {
  ok: true;
  message: string;
  checkout: { payment: Payment; charge: CheckoutCharge; accessToken?: string };
};

@Injectable()
export class CheckoutService {
  constructor(
    private readonly authService: AuthService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Cadastro (quando necessário) + cobrança da bolsa.
   *
   * Se o gateway recusar depois de o cadastro ter sido feito, a conta **permanece**: ela é
   * o que permite ao aluno tentar de novo já logado, e o pagamento pendente já foi marcado
   * como falho pela compensação do `PaymentsService`. Desfazer o usuário aqui apagaria
   * também o endereço, as notificações dos admins e o e-mail de boas-vindas já enviado.
   */
  async checkout(
    sessionUser: JwtUser | undefined,
    dto: CheckoutInput,
    remoteIp?: string,
  ): Promise<CheckoutServiceResult> {
    const { userId, accessToken } = await this.resolveUser(sessionUser, dto);
    const { payment, charge } = await this.paymentsService.createCharge(
      userId,
      this.toChargeInput(dto, remoteIp),
    );

    return {
      ok: true,
      message: 'checkout-created',
      checkout: {
        payment,
        charge,
        ...(accessToken ? { accessToken } : {}),
      },
    };
  }

  /**
   * Com sessão, o usuário é o do token e o `customer` do corpo é **ignorado** — aceitar
   * cadastro de quem já está autenticado abriria uma segunda porta para criar conta, sem
   * o rate limit nem o e-mail do cadastro público.
   */
  private async resolveUser(
    sessionUser: JwtUser | undefined,
    dto: CheckoutInput,
  ): Promise<{ userId: string; accessToken?: string }> {
    if (sessionUser) {
      return { userId: sessionUser.userId };
    }

    if (!dto.customer) {
      throw new AppException('invalid-user');
    }

    const auth = await this.authService.register({
      ...dto.customer,
      // Guarda de qual bolsa nasceu o cadastro — mesmo campo que o formulário público usa.
      register_scholarship: dto.scholarship_id,
    });

    return { userId: auth.user.id, accessToken: auth.accessToken };
  }

  private toChargeInput(dto: CheckoutInput, remoteIp?: string): CreateChargeInput {
    const { payment } = dto;

    if (payment.method !== 'CREDIT_CARD') {
      return { scholarship_id: dto.scholarship_id, method: payment.method, renew: false };
    }

    // O IP do corpo é aceito, mas o da requisição vence: o antifraude do gateway só faz
    // sentido com a origem real da compra, e essa quem conhece é o servidor.
    const origin = remoteIp ?? payment.remoteIp;

    // Os dois primeiros são inalcançáveis (o `CheckoutSchema` já os exige para cartão e o
    // pipe global reprova antes daqui); o `if` existe para o compilador, e sem ele seria
    // preciso um cast — justamente o que esconderia uma regra removida do schema.
    if (!payment.creditCard || !payment.creditCardHolderInfo || !origin) {
      throw new AppException('validation-error');
    }

    return {
      scholarship_id: dto.scholarship_id,
      method: 'CREDIT_CARD',
      renew: false,
      installment_count: payment.installment_count,
      creditCard: payment.creditCard,
      creditCardHolderInfo: payment.creditCardHolderInfo,
      remoteIp: origin,
    };
  }
}
