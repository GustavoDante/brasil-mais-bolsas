import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import {
  ORDERS_RENEWAL_DEFAULTS,
  type OrdersRenewalItem,
  type OrdersRenewalOptions,
  type OrdersRenewalSummary,
} from './orders-renewal.types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/** Status que indicam uma renovação já emitida e ainda aguardando pagamento. */
const OPEN_PAYMENT_STATUSES = ['WAITING', 'PENDING'];

interface RenewalCandidate {
  id: string;
  user_id: string;
  scholarship_id: string;
  user: { name: string } | null;
  scholarship: { full_price: unknown };
}

/**
 * Renovação automática de pedidos (porte do job `checkOrdersForRenovation` da API antiga).
 *
 * Regra preservada: passados ~180 dias de um pagamento confirmado, o pedido é encerrado e
 * um novo pedido de renovação é aberto com um link de pagamento do Asaas cobrando 30% da
 * mensalidade cheia em até 4 parcelas.
 *
 * Melhorias em relação ao legado:
 * - a seleção acontece no banco (o legado carregava todos os pedidos ativos na memória);
 * - janela de tolerância: o legado exigia diferença de exatamente 180 dias, então um dia
 *   sem execução perdia a renovação para sempre;
 * - a chamada ao Asaas ficou fora da transação (o legado mantinha a transação aberta
 *   durante o HTTP externo), com compensação caso a persistência falhe;
 * - cada pedido é isolado: uma falha não interrompe os demais, e o resultado é resumido.
 */
@Injectable()
export class OrdersRenewalService {
  private readonly logger = new Logger(OrdersRenewalService.name);
  private readonly options: OrdersRenewalOptions;

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaas: AsaasService,
    configService: ConfigService,
  ) {
    this.options = {
      triggerDays: this.readNumber(configService, 'ORDERS_RENEWAL_TRIGGER_DAYS', 'triggerDays'),
      graceDays: this.readNumber(configService, 'ORDERS_RENEWAL_GRACE_DAYS', 'graceDays'),
      percent: this.readNumber(configService, 'ORDERS_RENEWAL_PERCENT', 'percent'),
      maxInstallments: this.readNumber(
        configService,
        'ORDERS_RENEWAL_MAX_INSTALLMENTS',
        'maxInstallments',
      ),
      dueDateLimitDays: this.readNumber(
        configService,
        'ORDERS_RENEWAL_DUE_DATE_LIMIT_DAYS',
        'dueDateLimitDays',
      ),
    };
  }

  getOptions(): OrdersRenewalOptions {
    return { ...this.options };
  }

  async run(reference: Date = new Date()): Promise<OrdersRenewalSummary> {
    const startedAt = new Date();
    const { triggerDays, graceDays } = this.options;

    // Pagamento com idade entre `triggerDays` e `triggerDays + graceDays`.
    const windowEnd = new Date(reference.getTime() - triggerDays * DAY_IN_MS);
    const windowStart = new Date(reference.getTime() - (triggerDays + graceDays) * DAY_IN_MS);

    const candidates: RenewalCandidate[] = await this.prisma.order.findMany({
      where: {
        expired: false,
        payments: {
          some: { status: 'PAID', created_at: { gte: windowStart, lte: windowEnd } },
        },
      },
      select: {
        id: true,
        user_id: true,
        scholarship_id: true,
        user: { select: { name: true } },
        scholarship: { select: { full_price: true } },
      },
    });

    const items: OrdersRenewalItem[] = [];

    for (const order of candidates) {
      items.push(await this.renewOrder(order));
    }

    const finishedAt = new Date();
    const summary: OrdersRenewalSummary = {
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
      scanned: candidates.length,
      renewed: items.filter((item) => item.outcome === 'renewed').length,
      skipped: items.filter((item) => item.outcome === 'skipped').length,
      failed: items.filter((item) => item.outcome === 'failed').length,
      items,
    };

    this.logger.log(
      `renovação de pedidos: ${summary.scanned} avaliados, ${summary.renewed} renovados, ` +
        `${summary.skipped} pulados, ${summary.failed} com falha (${summary.duration_ms}ms)`,
    );

    return summary;
  }

  private async renewOrder(order: RenewalCandidate): Promise<OrdersRenewalItem> {
    const base: OrdersRenewalItem = {
      order_id: order.id,
      user_id: order.user_id,
      outcome: 'skipped',
    };

    // O aluno já tem uma renovação aberta aguardando pagamento: não cobra de novo.
    const openRenewal = await this.prisma.order.findFirst({
      where: {
        user_id: order.user_id,
        is_renew: true,
        expired: false,
        payments: { some: { status: { in: OPEN_PAYMENT_STATUSES } } },
      },
      select: { id: true },
    });

    if (openRenewal) {
      return { ...base, reason: 'renovacao-pendente' };
    }

    const fullPrice = Number(order.scholarship.full_price);
    if (!Number.isFinite(fullPrice) || fullPrice <= 0) {
      return { ...base, outcome: 'failed', reason: 'bolsa-sem-valor' };
    }

    const value = Number(((fullPrice * this.options.percent) / 100).toFixed(2));

    let renewalOrderId: string | null = null;

    try {
      const renewalOrder = await this.prisma.order.create({
        data: {
          user_id: order.user_id,
          scholarship_id: order.scholarship_id,
          is_renew: true,
          expired: false,
          code: await this.nextOrderCode(),
        },
        select: { id: true, code: true },
      });
      renewalOrderId = renewalOrder.id;

      // Chamada externa fora de transação: o legado segurava a transação durante o HTTP.
      const paymentLink = await this.asaas.createPaymentLink({
        name: order.user?.name ?? `Usuario ${order.user_id}`,
        value,
        dueDateLimitDays: this.options.dueDateLimitDays,
        chargeType: 'INSTALLMENT',
        billingType: 'UNDEFINED',
        externalReference: renewalOrder.id,
        maxInstallmentCount: this.options.maxInstallments,
      });

      await this.prisma.$transaction([
        this.prisma.payment.create({
          data: {
            user_id: order.user_id,
            scholarship_id: order.scholarship_id,
            order_id: renewalOrder.id,
            status: 'WAITING',
            payment_type: 'UNDEFINED',
            own_code: `${renewalOrder.code}-RENEWAL-${Date.now()}`,
            gateway_payment_id: paymentLink.id,
            url_boleto: paymentLink.url,
            full_price: fullPrice.toFixed(2),
            final_price: value.toFixed(2),
            discount: (100 - this.options.percent).toFixed(2),
            // O legado não marcava o pagamento como renovação, apesar do campo existir.
            renew: true,
          },
        }),
        this.prisma.order.update({ where: { id: order.id }, data: { expired: true } }),
      ]);

      return {
        ...base,
        outcome: 'renewed',
        renewal_order_id: renewalOrder.id,
        value,
      };
    } catch (error) {
      // Compensação: sem pagamento vinculado, o pedido de renovação órfão é removido para
      // que a próxima execução possa tentar de novo.
      if (renewalOrderId) {
        await this.prisma.order
          .delete({ where: { id: renewalOrderId } })
          .catch((cleanupError: unknown) =>
            this.logger.error(
              `falha ao remover pedido de renovação órfão ${renewalOrderId}: ${describe(cleanupError)}`,
            ),
          );
      }

      this.logger.error(`falha ao renovar o pedido ${order.id}: ${describe(error)}`);
      return { ...base, outcome: 'failed', reason: describe(error) };
    }
  }

  /** Mesma estratégia do OrdersService: maior código + 1, começando em 100000. */
  private async nextOrderCode(): Promise<number> {
    const latest = await this.prisma.order.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    return latest ? latest.code + 1 : 100000;
  }

  private readNumber(
    configService: ConfigService,
    envKey: string,
    optionKey: keyof OrdersRenewalOptions,
  ): number {
    const raw = configService.get<string>(envKey);
    if (raw === undefined || raw === null || raw === '') return ORDERS_RENEWAL_DEFAULTS[optionKey];

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      this.logger.warn(`${envKey}="${raw}" inválido; usando ${ORDERS_RENEWAL_DEFAULTS[optionKey]}`);
      return ORDERS_RENEWAL_DEFAULTS[optionKey];
    }

    return parsed;
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message.split('\n')[0];
  return String(error);
}
