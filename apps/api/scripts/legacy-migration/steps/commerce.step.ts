import type { Prisma } from '@repo/db';
import { BatchWriter, type MigrationContext, type MigrationStep } from '../lib/context';
import { legacyId } from '../lib/ids';
import {
  bool,
  createdAt,
  date,
  integer,
  mapPaymentType,
  normalizeStatus,
  nullableBool,
  requiredText,
  text,
  updatedAt,
} from '../lib/transforms';
import { legacyKeyOf, parentId, requireDecimal, requireText } from './helpers';

type OrderRow = Prisma.OrderCreateManyInput & { id: string };
type PaymentRow = Prisma.PaymentCreateManyInput & { id: string };
type SignedContractRow = Prisma.SignedContractCreateManyInput & { id: string };

/**
 * `Order.code` is UNIQUE in the new schema. The legacy default was a random 8 digit token,
 * so collisions (and NULLs) are possible: the first row keeps its code, the others get the
 * next free number above the current maximum.
 */
async function planOrderCodes(ctx: MigrationContext, table: string): Promise<Map<string, number>> {
  const rows = await ctx.legacy.project<{ id: unknown; code: unknown }>(table, ['id', 'code']);
  const plan = new Map<string, number>();
  const used = new Set<number>();

  let next = 0;
  for (const row of rows) {
    const code = Number.parseInt(String(row.code ?? ''), 10);
    if (Number.isFinite(code) && code > next) next = code;
  }
  next += 1;

  for (const row of rows) {
    const key = String(row.id);
    const parsed = Number.parseInt(String(row.code ?? ''), 10);
    const code = Number.isFinite(parsed) ? parsed : null;

    if (code !== null && !used.has(code)) {
      used.add(code);
      plan.set(key, code);
      continue;
    }

    while (used.has(next)) next += 1;
    used.add(next);
    plan.set(key, next);
    ctx.report.renamed(
      'orders',
      key,
      code === null ? 'code-vazio-gerado' : 'code-duplicado-gerado',
      `${code ?? 'null'} -> ${next}`,
    );
  }

  return plan;
}

export const ordersStep: MigrationStep = {
  name: 'orders',
  description: 'orders -> Order (code único)',
  sources: ['orders', 'Orders'],
  async run(ctx, table) {
    const step = 'orders';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const codes = await planOrderCodes(ctx, table);

    const writer = new BatchWriter<OrderRow>(ctx, step, {
      model: 'order',
      createMany: (rows) => ctx.prisma.order.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) => ctx.prisma.order.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const user = await parentId(ctx, 'user', row['user_id']);
        const scholarship = await parentId(ctx, 'scholarship', row['scholarship_id']);
        if (!user || !scholarship) {
          ctx.report.skipped(
            step,
            key,
            !user ? 'usuario-inexistente' : 'bolsa-inexistente',
            `user_id=${String(row['user_id'] ?? '')} scholarship_id=${String(row['scholarship_id'] ?? '')}`,
          );
          continue;
        }

        await writer.push({
          id: legacyId('order', key),
          user_id: user,
          scholarship_id: scholarship,
          expired: bool(row, ['expired'], false),
          is_renew: bool(row, ['is_renew'], false),
          defaulter: bool(row, ['defaulter'], false),
          code: codes.get(key) ?? 0,
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const paymentsStep: MigrationStep = {
  name: 'payments',
  description: 'payments -> Payment (payment_type -> enum, FLOAT -> DECIMAL(12,2))',
  sources: ['payments', 'Payments'],
  async run(ctx, table) {
    const step = 'payments';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<PaymentRow>(ctx, step, {
      model: 'payment',
      createMany: (rows) => ctx.prisma.payment.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.payment.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const user = await parentId(ctx, 'user', row['user_id']);
        const scholarship = await parentId(ctx, 'scholarship', row['scholarship_id']);
        const order = await parentId(ctx, 'order', row['order_id']);

        if (!user || !scholarship || !order) {
          const reason = !user
            ? 'usuario-inexistente'
            : !scholarship
              ? 'bolsa-inexistente'
              : 'pedido-inexistente';
          ctx.report.skipped(
            step,
            key,
            reason,
            `user_id=${String(row['user_id'] ?? '')} scholarship_id=${String(row['scholarship_id'] ?? '')} order_id=${String(row['order_id'] ?? '')}`,
          );
          continue;
        }

        const paymentType = mapPaymentType(row['payment_type']);
        if (paymentType.fallback) {
          ctx.report.coerced(step, key, 'payment_type-desconhecido', paymentType.raw ?? 'null');
        }

        const status = text(row, ['status']);
        if (!status) ctx.report.coerced(step, key, 'status-vazio-usando-UNDEFINED');

        await writer.push({
          id: legacyId('payment', key),
          user_id: user,
          scholarship_id: scholarship,
          order_id: order,
          gateway_order_id: text(row, ['gateway_order_id']),
          gateway_payment_id: text(row, ['gateway_payment_id']),
          status: normalizeStatus(status),
          payment_type: paymentType.value,
          code_boleto: text(row, ['code_boleto']),
          url_boleto: text(row, ['url_boleto']),
          boleto_expire_date: date(row, ['boleto_expire_date']),
          full_price: requireDecimal(ctx, step, key, row, ['full_price'], 'full_price'),
          final_price: requireDecimal(ctx, step, key, row, ['final_price'], 'final_price'),
          discount: requireDecimal(ctx, step, key, row, ['discount'], 'discount'),
          installment_count: integer(row, ['installment_count']),
          own_code: requiredText(row, ['own_code'], ''),
          renew: bool(row, ['renew'], false),
          delete: bool(row, ['delete'], false),
          active: bool(row, ['active'], true),
          date_paid: date(row, ['date_paid']),
          percent: integer(row, ['percent']),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const signedContractsStep: MigrationStep = {
  name: 'signed-contracts',
  description: 'signed_contracts -> SignedContract',
  sources: ['signed_contracts', 'SignedContracts'],
  async run(ctx, table) {
    const step = 'signed-contracts';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<SignedContractRow>(ctx, step, {
      model: 'signedContract',
      createMany: (rows) =>
        ctx.prisma.signedContract.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.signedContract.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const user = await parentId(ctx, 'user', row['user_id']);
        const scholarship = await parentId(ctx, 'scholarship', row['scholarship_id']);
        if (!user || !scholarship) {
          ctx.report.skipped(
            step,
            key,
            !user ? 'usuario-inexistente' : 'bolsa-inexistente',
            `user_id=${String(row['user_id'] ?? '')} scholarship_id=${String(row['scholarship_id'] ?? '')}`,
          );
          continue;
        }

        await writer.push({
          id: legacyId('signedContract', key),
          ip: requireText(ctx, step, key, row, ['ip'], 'ip'),
          isMobile: nullableBool(row, ['is_mobile', 'isMobile']),
          user_id: user,
          scholarship_id: scholarship,
          deviceInfo: requiredText(row, ['device_info', 'deviceInfo'], ''),
          delete: bool(row, ['delete'], false),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};
