import type { Prisma } from '@repo/db';
import { BatchWriter, type MigrationContext, type MigrationStep } from '../lib/context';
import { legacyId } from '../lib/ids';
import type { LegacyRow } from '../lib/legacy-db';
import { bool, createdAt, date, normalizeEmail, read, text, updatedAt } from '../lib/transforms';
import { legacyKeyOf, parentId, requireText } from './helpers';

type IndicationRow = Prisma.IndicationCreateManyInput & { id: string };
type IndicationCallRow = Prisma.IndicationCallCreateManyInput & { id: string };
type PossiblePartnerRow = Prisma.PossiblePartnerCreateManyInput & { id: string };
type PossiblePartnerCallRow = Prisma.PossiblePartnerCallCreateManyInput & { id: string };
type CallRow = Prisma.CallCreateManyInput & { id: string };
type NotificationRow = Prisma.NotificationCreateManyInput & { id: string };
type FaqRow = Prisma.FaqCreateManyInput & { id: string };

const INDICATION_TABLES = ['indications', 'Indications'];

/** legacy indication id -> legacy id of the record that survived the (email, cell) UNIQUE. */
type IndicationPlan = Map<string, string>;

let indicationPlanCache: IndicationPlan | null = null;

/**
 * `Indication` gained a UNIQUE (email, cell) constraint. Duplicates are collapsed into the
 * oldest non-deleted record, and the calls of the dropped rows are re-pointed to it.
 */
async function getIndicationPlan(ctx: MigrationContext): Promise<IndicationPlan> {
  if (indicationPlanCache) return indicationPlanCache;

  const plan: IndicationPlan = new Map();
  const table = await ctx.legacy.resolveTable(INDICATION_TABLES);
  if (!table) {
    indicationPlanCache = plan;
    return plan;
  }

  const deleted = await ctx.legacy.column(table, ['delete']);
  const created = await ctx.legacy.column(table, ['created_at', 'createdAt']);
  const projection = await ctx.legacy.project(table, [
    'id',
    'email',
    'cell',
    ...[deleted, created].filter((column): column is string => column !== null),
  ]);

  const groups = new Map<string, LegacyRow[]>();
  for (const row of projection) {
    const key = `${normalizeEmail(text(row, ['email'])) ?? ''}|${text(row, ['cell']) ?? ''}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => {
      const deletedA = deleted ? (a[deleted] === true ? 1 : 0) : 0;
      const deletedB = deleted ? (b[deleted] === true ? 1 : 0) : 0;
      if (deletedA !== deletedB) return deletedA - deletedB;

      const timeA = created ? (date(a, [created])?.getTime() ?? 0) : 0;
      const timeB = created ? (date(b, [created])?.getTime() ?? 0) : 0;
      if (timeA !== timeB) return timeA - timeB;

      return Number(a['id']) - Number(b['id']);
    });

    const winner = String(ordered[0]?.['id'] ?? '');
    for (const row of ordered) plan.set(String(row['id']), winner);
  }

  indicationPlanCache = plan;
  return plan;
}

export const indicationsStep: MigrationStep = {
  name: 'indications',
  description: 'indications -> Indication (unique email+cell)',
  sources: INDICATION_TABLES,
  async run(ctx, table) {
    const step = 'indications';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const plan = await getIndicationPlan(ctx);

    const writer = new BatchWriter<IndicationRow>(ctx, step, {
      model: 'indication',
      createMany: (rows) => ctx.prisma.indication.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.indication.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const winner = plan.get(key);
        if (winner && winner !== key) {
          ctx.report.skipped(step, key, 'indicacao-duplicada-email-cell', `mantida=${winner}`);
          continue;
        }

        const user = await parentId(ctx, 'user', row['user_id']);
        if (!user) {
          ctx.report.skipped(
            step,
            key,
            'usuario-inexistente',
            `user_id=${String(row['user_id'] ?? '')}`,
          );
          continue;
        }

        await writer.push({
          id: legacyId('indication', key),
          user_id: user,
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          email: requireText(ctx, step, key, row, ['email'], 'email'),
          cell: requireText(ctx, step, key, row, ['cell'], 'cell'),
          city: requireText(ctx, step, key, row, ['city'], 'city'),
          delete: bool(row, ['delete'], false),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const indicationCallsStep: MigrationStep = {
  name: 'indication-calls',
  description: 'call_indications -> IndicationCall (receiver_id legado = indicação)',
  sources: ['call_indications', 'CallIndications'],
  async run(ctx, table) {
    const step = 'indication-calls';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const plan = await getIndicationPlan(ctx);

    const writer = new BatchWriter<IndicationCallRow>(ctx, step, {
      model: 'indicationCall',
      createMany: (rows) =>
        ctx.prisma.indicationCall.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.indicationCall.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        // In the legacy schema the association was `Indications.hasMany(CallIndications,
        // { foreignKey: 'receiver_id' })`, so receiver_id holds the indication id.
        const legacyReceiver = String(row['receiver_id'] ?? '');
        const target = plan.get(legacyReceiver) ?? legacyReceiver;
        const indication = await parentId(ctx, 'indication', target);
        if (!indication) {
          ctx.report.skipped(step, key, 'indicacao-inexistente', `receiver_id=${legacyReceiver}`);
          continue;
        }
        if (target !== legacyReceiver) {
          ctx.report.coerced(
            step,
            key,
            'indicacao-remapeada-para-registro-mantido',
            `${legacyReceiver} -> ${target}`,
          );
        }

        const caller = await parentId(ctx, 'user', row['caller_id']);
        if (!caller) {
          ctx.report.skipped(
            step,
            key,
            'usuario-caller-inexistente',
            `caller_id=${String(row['caller_id'] ?? '')}`,
          );
          continue;
        }

        await writer.push({
          id: legacyId('indicationCall', key),
          indication_id: indication,
          caller_id: caller,
          // The legacy table had no user receiver: receiver_id pointed at the indication.
          receiver_id: null,
          description: requireText(ctx, step, key, row, ['description'], 'description'),
          to_return: bool(row, ['to_return'], false),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const possiblePartnersStep: MigrationStep = {
  name: 'possible-partners',
  description: 'possible_partners -> PossiblePartner',
  sources: ['possible_partners', 'PossiblePartners'],
  async run(ctx, table) {
    const step = 'possible-partners';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<PossiblePartnerRow>(ctx, step, {
      model: 'possiblePartner',
      createMany: (rows) =>
        ctx.prisma.possiblePartner.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.possiblePartner.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        await writer.push({
          id: legacyId('possiblePartner', key),
          institutionName: text(row, ['institutionName', 'institution_name']),
          cnpj: text(row, ['cnpj']),
          modality: text(row, ['modality']),
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          email: requireText(ctx, step, key, row, ['email'], 'email'),
          message: text(row, ['message']),
          cell: requireText(ctx, step, key, row, ['cell'], 'cell'),
          city: text(row, ['city']),
          numStudents: text(row, ['numStudents', 'num_students']),
          delete: bool(row, ['delete'], false),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const possiblePartnerCallsStep: MigrationStep = {
  name: 'possible-partner-calls',
  description: 'call_possible_partners -> PossiblePartnerCall (receiver_id legado = parceiro)',
  sources: ['call_possible_partners', 'CallPossiblePartners'],
  async run(ctx, table) {
    const step = 'possible-partner-calls';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<PossiblePartnerCallRow>(ctx, step, {
      model: 'possiblePartnerCall',
      createMany: (rows) =>
        ctx.prisma.possiblePartnerCall.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.possiblePartnerCall.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        // Same inversion as CallIndications: receiver_id points at the possible partner.
        const possiblePartner = await parentId(ctx, 'possiblePartner', row['receiver_id']);
        if (!possiblePartner) {
          ctx.report.skipped(
            step,
            key,
            'possivel-parceiro-inexistente',
            `receiver_id=${String(row['receiver_id'] ?? '')}`,
          );
          continue;
        }

        const caller = await parentId(ctx, 'user', row['caller_id']);
        if (!caller) {
          ctx.report.skipped(
            step,
            key,
            'usuario-caller-inexistente',
            `caller_id=${String(row['caller_id'] ?? '')}`,
          );
          continue;
        }

        await writer.push({
          id: legacyId('possiblePartnerCall', key),
          possible_partner_id: possiblePartner,
          caller_id: caller,
          receiver_id: null,
          description: requireText(ctx, step, key, row, ['description'], 'description'),
          to_return: bool(row, ['to_return'], false),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const callsStep: MigrationStep = {
  name: 'calls',
  description: 'calls -> Call (ligações para usuários)',
  sources: ['calls', 'Calls'],
  async run(ctx, table) {
    const step = 'calls';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<CallRow>(ctx, step, {
      model: 'call',
      createMany: (rows) => ctx.prisma.call.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) => ctx.prisma.call.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const caller = await parentId(ctx, 'user', row['caller_id']);
        if (!caller) {
          ctx.report.skipped(
            step,
            key,
            'usuario-caller-inexistente',
            `caller_id=${String(row['caller_id'] ?? '')}`,
          );
          continue;
        }

        const receiver = await parentId(ctx, 'user', row['receiver_id']);
        if (!receiver && read(row, ['receiver_id']) !== null) {
          ctx.report.coerced(
            step,
            key,
            'usuario-receiver-inexistente-nulo',
            `receiver_id=${String(row['receiver_id'] ?? '')}`,
          );
        }

        await writer.push({
          id: legacyId('call', key),
          caller_id: caller,
          receiver_id: receiver,
          description: requireText(ctx, step, key, row, ['description'], 'description'),
          to_return: bool(row, ['to_return'], false),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const notificationsStep: MigrationStep = {
  name: 'notifications',
  description: 'notifications -> Notification',
  sources: ['notifications', 'Notifications'],
  async run(ctx, table) {
    const step = 'notifications';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<NotificationRow>(ctx, step, {
      model: 'notification',
      createMany: (rows) =>
        ctx.prisma.notification.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.notification.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const user = await parentId(ctx, 'user', row['user_id']);
        if (!user) {
          ctx.report.skipped(
            step,
            key,
            'usuario-inexistente',
            `user_id=${String(row['user_id'] ?? '')}`,
          );
          continue;
        }

        await writer.push({
          id: legacyId('notification', key),
          title: requireText(ctx, step, key, row, ['title'], 'title'),
          message: requireText(ctx, step, key, row, ['message'], 'message'),
          read: bool(row, ['read'], false),
          user_id: user,
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const faqsStep: MigrationStep = {
  name: 'faqs',
  description: 'faqs -> Faq',
  sources: ['faqs', 'Faqs'],
  async run(ctx, table) {
    const step = 'faqs';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<FaqRow>(ctx, step, {
      model: 'faq',
      createMany: (rows) => ctx.prisma.faq.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) => ctx.prisma.faq.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);
        await writer.push({
          id: legacyId('faq', key),
          question: requireText(ctx, step, key, row, ['question'], 'question'),
          answer: requireText(ctx, step, key, row, ['answer'], 'answer'),
          delete: bool(row, ['delete'], false),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};
