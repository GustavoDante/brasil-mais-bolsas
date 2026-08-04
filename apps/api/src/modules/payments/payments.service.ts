import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PaymentType, PersonType, Prisma } from '@repo/db';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import type { AsaasPaymentRequest } from '../../integrations/asaas/types/asaas.types';
import { MailService } from '../../integrations/mail/mail.service';
import { OrdersService } from '../orders/orders.service';
import type { AsaasWebhookDto } from './dto/asaas-webhook.dto';
import type { CreateCreditCardPaymentDto } from './dto/create-credit-card-payment.dto';
import type { CreateInterestPaymentDto } from './dto/create-interest-payment.dto';
import type { CreatePixPaymentDto } from './dto/create-pix-payment.dto';

type PaymentUser = Prisma.UserGetPayload<{
  include: { address: true; client: true };
}>;

type PaymentScholarship = Prisma.ScholarshipGetPayload<Record<string, never>>;
type PaymentOrder = Prisma.OrderGetPayload<Record<string, never>>;
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly mailService: MailService,
  ) {}

  async createCreditCardPayment(userId: string, dto: CreateCreditCardPaymentDto) {
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

  async createInterestPayment(userId: string, dto: CreateInterestPaymentDto) {
    const { user, scholarship } = await this.getPaymentContext(userId, dto.scholarship_id);

    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        user_id: user.id,
        scholarship_id: scholarship.id,
        payment_type: PaymentType.INTEREST,
        delete: false,
      },
    });

    if (existingPayment) {
      throw new BadRequestException('interest-payment-already-exists');
    }

    const customerId = await this.ensureAsaasCustomer(user);
    const order = await this.ordersService.getOrCreateOpenOrder(user.id, scholarship.id, false);
    const payment = await this.createPendingPayment({
      userId: user.id,
      scholarship,
      order,
      paymentType: PaymentType.INTEREST,
      installmentCount: 1,
      renew: false,
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
        message: 'interest-payment-created-successfully',
        paymentId: updatedPayment.id,
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

  async createPixPayment(userId: string, dto: CreatePixPaymentDto) {
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
      throw new ServiceUnavailableException('asaas-webhook-token-not-configured');
    }

    if (!accessToken || accessToken !== expectedToken) {
      throw new UnauthorizedException('invalid-asaas-webhook-token');
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
      throw new BadRequestException('invalid-user');
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
      throw new BadRequestException('invalid-scholarship');
    }

    return { user, scholarship };
  }

  private async ensureAsaasCustomer(user: PaymentUser): Promise<string> {
    if (user.client) {
      return user.client.id;
    }

    if (!user.cpf) {
      throw new BadRequestException('user-cpf-required');
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
    return new Date().toISOString().slice(0, 10);
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
