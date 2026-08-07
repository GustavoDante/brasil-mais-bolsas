import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PaymentType, PersonType, Prisma } from '@repo/db';
import type {
  CheckoutCharge,
  CreateBoletoPaymentInput,
  CreateCreditCardPaymentInput,
  CreatePixPaymentInput,
} from '@repo/contracts';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import type { AsaasPaymentRequest } from '../../integrations/asaas/types/asaas.types';
import { MailService } from '../../integrations/mail/mail.service';
import { OrdersService } from '../orders/orders.service';
import type { AsaasWebhookDto } from './dto/asaas-webhook.dto';
import { AppException } from '../../common/exceptions/app.exception';

type PaymentUser = Prisma.UserGetPayload<{
  include: { address: true; client: true };
}>;

type PaymentScholarship = Prisma.ScholarshipGetPayload<Record<string, never>>;
type PaymentOrder = Prisma.OrderGetPayload<Record<string, never>>;

/**
 * Entrada de `createCharge` — união discriminada pela forma de pagamento: só o cartão
 * carrega dados de cartão, e o compilador não deixa montar a chamada pela metade.
 */
export type CreateChargeInput = { scholarship_id: string; renew?: boolean } & (
  | { method: 'PIX' | 'BOLETO' }
  | {
      method: 'CREDIT_CARD';
      installment_count: number;
      creditCard: NonNullable<CreateCreditCardPaymentInput['creditCard']>;
      creditCardHolderInfo: NonNullable<CreateCreditCardPaymentInput['creditCardHolderInfo']>;
      remoteIp: string;
    }
);
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Cobra pela forma escolhida e devolve o resultado **normalizado** (`CheckoutCharge`).
   *
   * Existe para o checkout, que precisa tratar as três formas pela mesma saída: a resposta
   * do gateway muda de campo conforme o método (QR Code no PIX, linha digitável no boleto,
   * nada disso no cartão) e sem esta camada a decisão de qual campo ler vaza para a tela.
   */
  async createCharge(
    userId: string,
    input: CreateChargeInput,
  ): Promise<{ payment: Prisma.PaymentGetPayload<Record<string, never>>; charge: CheckoutCharge }> {
    if (input.method === 'CREDIT_CARD') {
      const result = await this.createCreditCardPayment(userId, {
        scholarship_id: input.scholarship_id,
        installment_count: input.installment_count,
        renew: input.renew,
        creditCard: input.creditCard,
        creditCardHolderInfo: input.creditCardHolderInfo,
        remoteIp: input.remoteIp,
      });
      return {
        payment: result.payment,
        charge: {
          method: 'CREDIT_CARD',
          status: result.gateway.status,
          invoiceUrl: result.gateway.invoiceUrl ?? null,
        },
      };
    }

    if (input.method === 'BOLETO') {
      const result = await this.createBoletoPayment(userId, input);
      return {
        payment: result.payment,
        charge: {
          method: 'BOLETO',
          status: result.gateway.status,
          invoiceUrl: result.gateway.invoiceUrl ?? null,
          bankSlipUrl: result.gateway.bankSlipUrl ?? null,
          barCode: result.gateway.identificationField ?? null,
        },
      };
    }

    const result = await this.createPixPayment(userId, input);
    return {
      payment: result.payment,
      charge: {
        method: 'PIX',
        status: result.gateway.status,
        invoiceUrl: result.gateway.invoiceUrl ?? null,
        pixQrCode: result.pixQrCode,
      },
    };
  }

  /** Pagamento do próprio usuário — base do polling da tela de acompanhamento. */
  async findOwnPayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, user_id: userId, delete: false },
    });

    // 404 (e não 403) também quando o pagamento é de outro usuário: distinguir os dois
    // casos transformaria a rota num verificador de ids de pagamento.
    if (!payment) {
      throw new AppException('payment-not-found');
    }

    return payment;
  }

  async createCreditCardPayment(userId: string, dto: CreateCreditCardPaymentInput) {
    const { user, scholarship } = await this.getPaymentContext(userId, dto.scholarship_id);
    const customerId = await this.ensureAsaasCustomer(user);
    const order = await this.ordersService.getOrCreateOpenOrder(
      user.id,
      scholarship.id,
      dto.renew === true,
    );
    const payment = await this.createPendingPayment({
      userId: user.id,
      scholarship,
      order,
      paymentType: PaymentType.CREDIT_CARD,
      installmentCount: dto.installment_count ?? 1,
      renew: dto.renew === true,
    });

    const installmentCount = dto.installment_count ?? 1;
    const finalPrice = this.toNumber(scholarship.final_price);
    const payload: AsaasPaymentRequest = {
      customer: customerId,
      billingType: PaymentType.CREDIT_CARD,
      dueDate: this.todayAsaasDate(),
      description: this.buildPaymentDescription(scholarship),
      externalReference: payment.id,
      creditCard: dto.creditCard,
      creditCardHolderInfo: dto.creditCardHolderInfo,
      remoteIp: dto.remoteIp,
      ...(installmentCount > 1
        ? {
            value: finalPrice,
            installmentCount,
            installmentValue: Number((finalPrice / installmentCount).toFixed(2)),
          }
        : { value: finalPrice }),
    };

    try {
      const asaasPayment = await this.asaasService.createPayment(payload);
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gateway_payment_id: asaasPayment.id,
          status: asaasPayment.status,
          url_boleto: asaasPayment.invoiceUrl ?? asaasPayment.transactionReceiptUrl,
        },
      });

      return {
        ok: true,
        message: 'payment-created',
        payment: updatedPayment,
        gateway: {
          id: asaasPayment.id,
          status: asaasPayment.status,
          invoiceUrl: asaasPayment.invoiceUrl,
          creditCard: asaasPayment.creditCard,
        },
      };
    } catch (error) {
      await this.markPaymentAsFailed(payment.id);
      throw error;
    }
  }

  async createBoletoPayment(userId: string, dto: CreateBoletoPaymentInput) {
    const { user, scholarship } = await this.getPaymentContext(userId, dto.scholarship_id);
    const customerId = await this.ensureAsaasCustomer(user);
    const order = await this.ordersService.getOrCreateOpenOrder(
      user.id,
      scholarship.id,
      dto.renew === true,
    );
    const payment = await this.createPendingPayment({
      userId: user.id,
      scholarship,
      order,
      paymentType: PaymentType.BOLETO,
      installmentCount: 1,
      renew: dto.renew === true,
    });

    const dueDate = this.boletoDueDate();

    try {
      const asaasPayment = await this.asaasService.createPayment({
        customer: customerId,
        billingType: PaymentType.BOLETO,
        value: this.toNumber(scholarship.final_price),
        dueDate: this.toAsaasDate(dueDate),
        description: this.buildPaymentDescription(scholarship),
        externalReference: payment.id,
      });
      const identificationField = await this.fetchBoletoIdentificationField(asaasPayment.id);
      const bankSlipUrl = asaasPayment.bankSlipUrl ?? asaasPayment.invoiceUrl;
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gateway_payment_id: asaasPayment.id,
          status: asaasPayment.status,
          code_boleto: identificationField,
          url_boleto: bankSlipUrl,
          boleto_expire_date: dueDate,
        },
      });

      return {
        ok: true,
        message: 'boleto-payment-created',
        payment: updatedPayment,
        gateway: {
          id: asaasPayment.id,
          status: asaasPayment.status,
          invoiceUrl: asaasPayment.invoiceUrl,
          bankSlipUrl,
          identificationField,
          dueDate: this.toAsaasDate(dueDate),
        },
      };
    } catch (error) {
      await this.markPaymentAsFailed(payment.id);
      throw error;
    }
  }

  async createPixPayment(userId: string, dto: CreatePixPaymentInput) {
    const { user, scholarship } = await this.getPaymentContext(userId, dto.scholarship_id);
    const customerId = await this.ensureAsaasCustomer(user);
    const order = await this.ordersService.getOrCreateOpenOrder(
      user.id,
      scholarship.id,
      dto.renew === true,
    );
    const payment = await this.createPendingPayment({
      userId: user.id,
      scholarship,
      order,
      paymentType: PaymentType.PIX,
      installmentCount: 1,
      renew: dto.renew === true,
    });

    try {
      const asaasPayment = await this.asaasService.createPayment({
        customer: customerId,
        billingType: PaymentType.PIX,
        value: this.toNumber(scholarship.final_price),
        dueDate: this.todayAsaasDate(),
        description: this.buildPaymentDescription(scholarship),
        externalReference: payment.id,
      });
      const pixQrCode = await this.asaasService.getPixQrCode(asaasPayment.id);
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gateway_payment_id: asaasPayment.id,
          status: asaasPayment.status,
          code_boleto: pixQrCode.payload,
          url_boleto: asaasPayment.invoiceUrl,
          boleto_expire_date: new Date(pixQrCode.expirationDate),
        },
      });

      return {
        ok: true,
        message: 'pix-payment-created',
        payment: updatedPayment,
        gateway: {
          id: asaasPayment.id,
          status: asaasPayment.status,
          invoiceUrl: asaasPayment.invoiceUrl,
        },
        pixQrCode,
      };
    } catch (error) {
      await this.markPaymentAsFailed(payment.id);
      throw error;
    }
  }

  async handleAsaasWebhook(accessToken: string | undefined, dto: AsaasWebhookDto) {
    const expectedToken = this.configService.get<string>('ASAAS_WEBHOOK_TOKEN');
    if (!expectedToken) {
      throw new AppException('asaas-webhook-token-not-configured');
    }

    if (!accessToken || accessToken !== expectedToken) {
      throw new AppException('invalid-asaas-webhook-token');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { gateway_payment_id: dto.payment.id, delete: false },
    });

    if (!payment) {
      return {
        ok: true,
        message: 'payment-not-found-for-webhook',
        gatewayPaymentId: dto.payment.id,
      };
    }

    // Só é "confirmação nova" se o pagamento ainda não estava baixado — o Asaas reenvia o
    // mesmo evento em caso de falha, e o aluno não pode receber o e-mail duas vezes
    const isNewConfirmation = this.isPaidAsaasStatus(dto.payment.status) && !payment.date_paid;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: dto.payment.status,
        date_paid: this.isPaidAsaasStatus(dto.payment.status) ? new Date() : payment.date_paid,
      },
    });

    if (isNewConfirmation) {
      await this.sendPaymentConfirmedMail(payment.id);
    }

    return {
      ok: true,
      message: 'asaas-webhook-processed',
      event: dto.event,
      gatewayPaymentId: dto.payment.id,
    };
  }

  private async getPaymentContext(userId: string, scholarshipId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { address: true, client: true },
    });

    if (!user || user.delete) {
      throw new AppException('invalid-user');
    }

    const scholarship = await this.prisma.scholarship.findFirst({
      where: {
        id: scholarshipId,
        active: true,
        delete: false,
        expired: false,
      },
    });

    if (!scholarship) {
      throw new AppException('invalid-scholarship');
    }

    return { user, scholarship };
  }

  private async ensureAsaasCustomer(user: PaymentUser): Promise<string> {
    if (user.client) {
      return user.client.id;
    }

    if (!user.cpf) {
      throw new AppException('user-cpf-required');
    }

    const customer = await this.asaasService.createCustomer({
      name: user.name,
      cpfCnpj: user.cpf,
      email: user.email,
      phone: user.phone,
      mobilePhone: user.whatsapp_phone ?? user.phone,
      address: user.address?.street,
      addressNumber: user.address?.number,
      complement: user.address?.complement,
      province: user.address?.district,
      postalCode: user.address?.postal_code,
      externalReference: user.id,
      notificationDisabled: true,
    });

    await this.prisma.externalClient.create({
      data: {
        id: customer.id,
        name: customer.name,
        personType: PersonType.FISICA,
        externalReference: user.id,
        cpfCnpj: user.cpf,
        birthDate: user.birthdate,
        phone: user.phone,
      },
    });

    return customer.id;
  }

  private async createPendingPayment(params: {
    userId: string;
    scholarship: PaymentScholarship;
    order: PaymentOrder;
    paymentType: PaymentType;
    installmentCount: number;
    renew: boolean;
  }) {
    return this.prisma.payment.create({
      data: {
        user_id: params.userId,
        scholarship_id: params.scholarship.id,
        order_id: params.order.id,
        status: 'PENDING',
        payment_type: params.paymentType,
        full_price: params.scholarship.full_price,
        final_price: params.scholarship.final_price,
        discount: params.scholarship.discount,
        installment_count: params.installmentCount,
        own_code: `${params.order.code}-${params.paymentType}-${Date.now()}`,
        renew: params.renew,
      },
    });
  }

  private async markPaymentAsFailed(paymentId: string): Promise<void> {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' },
    });
  }

  private buildPaymentDescription(scholarship: PaymentScholarship): string {
    return `Bolsa Brasil Mais Bolsas ${scholarship.id}`;
  }

  private todayAsaasDate(): string {
    return this.toAsaasDate(new Date());
  }

  private toAsaasDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /** Vencimento do boleto: `PAYMENT_BOLETO_DUE_DAYS` dias a partir de hoje (padrão 3). */
  private boletoDueDate(): Date {
    const configured = Number(this.configService.get<string>('PAYMENT_BOLETO_DUE_DAYS'));
    const days = Number.isFinite(configured) && configured > 0 ? Math.trunc(configured) : 3;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  }

  /**
   * A linha digitável é opcional no fluxo: o registro do boleto no banco emissor é
   * assíncrono e o Asaas recusa a consulta enquanto ela não termina. Derrubar o checkout
   * por isso perderia uma cobrança já criada — o aluno paga pelo link do boleto, que a
   * criação já devolveu.
   */
  private async fetchBoletoIdentificationField(
    gatewayPaymentId: string,
  ): Promise<string | undefined> {
    try {
      const response = await this.asaasService.getBoletoIdentificationField(gatewayPaymentId);
      return response.identificationField;
    } catch (error) {
      this.logger.warn(
        `Linha digitável indisponível para a cobrança ${gatewayPaymentId}: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );
      return undefined;
    }
  }

  private toNumber(value: Prisma.Decimal | number): number {
    return Number(value);
  }

  /**
   * Avisa o aluno de que o pagamento entrou. O `MailService` já não lança, mas os dados
   * também são buscados aqui dentro para que qualquer problema no e-mail não devolva erro
   * ao Asaas — o webhook precisa responder 200 ou o gateway fica reenviando o evento.
   */
  private async sendPaymentConfirmedMail(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { name: true, email: true } },
        scholarship: {
          select: { course_description: true, institution: { select: { name: true } } },
        },
      },
    });

    if (!payment?.user.email) return;

    const description = [
      payment.scholarship?.course_description,
      payment.scholarship?.institution?.name,
    ]
      .filter(Boolean)
      .join(' — ');

    await this.mailService.sendPaymentConfirmed(payment.user.email, {
      name: payment.user.name,
      amount: Number(payment.final_price),
      scholarshipDescription: description || null,
    });
  }

  private isPaidAsaasStatus(status: string): boolean {
    return status === 'RECEIVED' || status === 'CONFIRMED' || status === 'RECEIVED_IN_CASH';
  }
}
