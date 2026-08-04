import type { Prisma } from '@repo/db';
import { BatchWriter, type MigrationContext, type MigrationStep } from '../lib/context';
import { legacyId } from '../lib/ids';
import type { LegacyRow, LegacySource } from '../lib/legacy-db';
import {
  MISSING_DATE,
  bool,
  createdAt,
  date,
  decimal,
  disambiguateEmail,
  normalizeEmail,
  placeholderEmail,
  mapPersonType,
  read,
  requiredText,
  text,
  updatedAt,
} from '../lib/transforms';
import { legacyKeyOf, parentId, requireDate, requireText } from './helpers';

type UserRow = Prisma.UserCreateManyInput & { id: string };
type AddressRow = Prisma.AddressCreateManyInput & { id: string };
type MinorRow = Prisma.MinorCreateManyInput & { id: string };
type ExternalClientRow = Prisma.ExternalClientCreateManyInput & { id: string };

interface EmailDecision {
  email: string;
  renamedFrom: string | null;
}

/** Column names differ between `sequelize.sync()` and the hand written migrations. */
async function resolveColumns(
  legacy: LegacySource,
  table: string,
  wanted: Record<string, string[]>,
): Promise<Record<string, string | null>> {
  const resolved: Record<string, string | null> = {};
  for (const [alias, candidates] of Object.entries(wanted)) {
    resolved[alias] = await legacy.column(table, candidates);
  }
  return resolved;
}

function timeOf(row: LegacyRow, keys: (string | null)[]): number {
  const value = date(
    row,
    keys.filter((key): key is string => key !== null),
  );
  return value ? value.getTime() : 0;
}

/**
 * `User.email` is UNIQUE in the new schema but was not in the legacy one (soft deleted users
 * kept their address). One record per e-mail keeps it; the others receive a
 * `local+legacy<id>@dominio` variant so nothing is lost and nothing collides.
 */
async function planUserEmails(
  ctx: MigrationContext,
  table: string,
): Promise<Map<string, EmailDecision>> {
  const columns = await resolveColumns(ctx.legacy, table, {
    deleted: ['delete'],
    active: ['active'],
    created: ['created_at', 'createdAt'],
    updated: ['updated_at', 'updatedAt'],
  });

  const selected = [
    'id',
    'email',
    ...Object.values(columns).filter((c): c is string => c !== null),
  ];
  const rows = await ctx.legacy.project(table, selected);

  const groups = new Map<string, LegacyRow[]>();
  const decisions = new Map<string, EmailDecision>();
  const used = new Set<string>();

  for (const row of rows) {
    const key = String(row['id']);
    const email = normalizeEmail(text(row, ['email']));
    if (!email) {
      const generated = placeholderEmail('legacy-user', key);
      decisions.set(key, { email: generated, renamedFrom: null });
      used.add(generated);
      ctx.report.renamed('users', key, 'email-vazio-gerado', generated);
      continue;
    }
    const group = groups.get(email);
    if (group) group.push(row);
    else groups.set(email, [row]);
  }

  for (const [email, group] of groups) {
    // Winner: not deleted > active > most recently updated > lowest legacy id.
    const ordered = [...group].sort((a, b) => {
      const deletedA = columns['deleted'] ? (a[columns['deleted']] === true ? 1 : 0) : 0;
      const deletedB = columns['deleted'] ? (b[columns['deleted']] === true ? 1 : 0) : 0;
      if (deletedA !== deletedB) return deletedA - deletedB;

      const inactiveA = columns['active'] ? (a[columns['active']] === false ? 1 : 0) : 0;
      const inactiveB = columns['active'] ? (b[columns['active']] === false ? 1 : 0) : 0;
      if (inactiveA !== inactiveB) return inactiveA - inactiveB;

      const timeA = timeOf(a, [columns['updated'], columns['created']]);
      const timeB = timeOf(b, [columns['updated'], columns['created']]);
      if (timeA !== timeB) return timeB - timeA;

      return Number(a['id']) - Number(b['id']);
    });

    ordered.forEach((row, index) => {
      const key = String(row['id']);
      if (index === 0) {
        decisions.set(key, { email, renamedFrom: null });
        used.add(email);
        return;
      }

      let candidate = disambiguateEmail(email, key);
      let attempt = 1;
      while (used.has(candidate)) {
        candidate = disambiguateEmail(email, `${key}-${attempt}`);
        attempt += 1;
      }
      used.add(candidate);
      decisions.set(key, { email: candidate, renamedFrom: email });
      ctx.report.renamed('users', key, 'email-duplicado', `${email} -> ${candidate}`);
    });
  }

  return decisions;
}

export const usersStep: MigrationStep = {
  name: 'users',
  description: 'users -> User (e-mail único, senha bcrypt preservada)',
  sources: ['users', 'Users'],
  async run(ctx, table) {
    const step = 'users';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const emails = await planUserEmails(ctx, table);

    const writer = new BatchWriter<UserRow>(ctx, step, {
      model: 'user',
      createMany: (rows) => ctx.prisma.user.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) => ctx.prisma.user.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const decision = emails.get(key);
        const email =
          decision?.email ??
          normalizeEmail(text(row, ['email'])) ??
          placeholderEmail('legacy-user', key);

        await writer.push({
          id: legacyId('user', key),
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          email,
          // Legacy hashes come from bcryptjs and are compatible with the `bcrypt` package.
          password: text(row, ['password']),
          reset_password_token: text(row, ['reset_password_token']),
          reset_password_expires: date(row, ['reset_password_expires']),
          type: (text(row, ['type']) ?? 'user').toLowerCase(),
          phone: requireText(ctx, step, key, row, ['phone'], 'phone'),
          secondary_phone: text(row, ['secondary_phone']),
          whatsapp_phone: text(row, ['whatsapp_phone']),
          friend_phone: text(row, ['friend_phone']),
          birthdate: requireDate(ctx, step, key, row, ['birthdate'], 'birthdate'),
          cpf: text(row, ['cpf']),
          rg: requireText(ctx, step, key, row, ['rg'], 'rg'),
          rg_emissor: requireText(ctx, step, key, row, ['rg_emissor'], 'rg_emissor'),
          family_income: decimal(row, ['family_income']),
          ccp: text(row, ['ccp']),
          observations: text(row, ['observations']),
          partner_id: await parentId(ctx, 'partner', row['partner_id']),
          register_scholarship: await parentId(ctx, 'scholarship', row['register_scholarship']),
          institution_id: await parentId(ctx, 'institution', row['institution_id']),
          active: bool(row, ['active'], true),
          delete: bool(row, ['delete'], false),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const addressesStep: MigrationStep = {
  name: 'addresses',
  description: 'addresses -> Address (1 endereço por usuário)',
  sources: ['addresses', 'Addresses'],
  async run(ctx, table) {
    const step = 'addresses';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    // Address.user_id is UNIQUE in the new schema: keep the most recent one per user.
    const columns = await resolveColumns(ctx.legacy, table, {
      created: ['created_at', 'createdAt'],
      updated: ['updated_at', 'updatedAt'],
    });
    const projection = await ctx.legacy.project(table, [
      'id',
      'user_id',
      ...Object.values(columns).filter((c): c is string => c !== null),
    ]);

    const winners = new Map<string, string>();
    const times = new Map<string, number>();
    for (const row of projection) {
      const user = String(row['user_id'] ?? '');
      if (!user) continue;
      const id = String(row['id']);
      const time = timeOf(row, [columns['updated'], columns['created']]);
      const currentTime = times.get(user);
      // Rows arrive ordered by id, so `>=` naturally keeps the highest id on a tie.
      if (currentTime === undefined || time >= currentTime) {
        winners.set(user, id);
        times.set(user, time);
      }
    }

    const writer = new BatchWriter<AddressRow>(ctx, step, {
      model: 'address',
      createMany: (rows) => ctx.prisma.address.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.address.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);
        const legacyUser = String(row['user_id'] ?? '');

        if (winners.get(legacyUser) !== key) {
          ctx.report.skipped(
            step,
            key,
            'endereco-duplicado-para-o-usuario',
            `user_id=${legacyUser}`,
          );
          continue;
        }

        const user = await parentId(ctx, 'user', row['user_id']);
        if (!user) {
          ctx.report.skipped(step, key, 'usuario-inexistente', `user_id=${legacyUser}`);
          continue;
        }

        await writer.push({
          id: legacyId('address', key),
          user_id: user,
          street: requireText(ctx, step, key, row, ['street'], 'street'),
          city: requireText(ctx, step, key, row, ['city'], 'city'),
          state: requireText(ctx, step, key, row, ['state'], 'state'),
          number: requireText(ctx, step, key, row, ['number'], 'number'),
          district: requireText(ctx, step, key, row, ['district'], 'district'),
          complement: text(row, ['complement']),
          postal_code: requireText(ctx, step, key, row, ['postal_code'], 'postal_code'),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const minorsStep: MigrationStep = {
  name: 'minors',
  description: 'users.minor_name / minor_birthdate -> Minor (nova tabela)',
  sources: ['users', 'Users'],
  async run(ctx, table) {
    const step = 'minors';
    const stat = ctx.report.stat(step);

    const writer = new BatchWriter<MinorRow>(ctx, step, {
      model: 'minor',
      createMany: (rows) => ctx.prisma.minor.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) => ctx.prisma.minor.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        const key = legacyKeyOf(row);
        const name = text(row, ['minor_name']);
        const birthdate = date(row, ['minor_birthdate']);
        const hasDependent = bool(row, ['has_dependent'], false);

        // Sem nenhum sinal de dependente: não há o que migrar.
        if (!name && !birthdate && !hasDependent) continue;

        stat.read += 1;

        // `Minor.name` é obrigatório. Linhas com apenas uma data residual (sem nome) não
        // representam um dependente de verdade e não viram registro.
        if (!name) {
          ctx.report.skipped(
            step,
            key,
            hasDependent
              ? 'has_dependent-sem-nome-do-dependente'
              : 'minor_birthdate-residual-sem-nome',
          );
          continue;
        }

        const user = await parentId(ctx, 'user', row['id']);
        if (!user) {
          ctx.report.skipped(step, key, 'usuario-inexistente');
          continue;
        }

        // O nome é dado real preenchido pelo usuário: migra mesmo com a flag desligada,
        // mas registra para conferência.
        if (!hasDependent) {
          ctx.report.coerced(step, key, 'has_dependent-false-com-nome-migrado');
        }

        if (!birthdate) {
          ctx.report.coerced(step, key, 'minor_birthdate-vazio-usando-data-sentinela');
        }

        await writer.push({
          // O legado guardava um único dependente dentro da linha do usuário; o id
          // determinístico usa esse "slot" para manter a reexecução idempotente. Dependentes
          // adicionais passam a ser criados normalmente pela API (a tabela agora aceita N).
          id: legacyId('minor', `user-${key}`),
          user_id: user,
          name,
          birthdate: birthdate ?? MISSING_DATE,
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const externalClientsStep: MigrationStep = {
  name: 'external-clients',
  description: 'clients -> ExternalClient (externalReference -> id do usuário)',
  sources: ['clients', 'Clients'],
  async run(ctx, table) {
    const step = 'external-clients';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const referenceColumn =
      (await ctx.legacy.column(table, ['external_reference', 'externalReference'])) ??
      'external_reference';
    const columns = await resolveColumns(ctx.legacy, table, {
      created: ['created_at', 'createdAt'],
      updated: ['updated_at', 'updatedAt'],
    });

    // ExternalClient.externalReference is UNIQUE: keep the most recent client per user.
    const projection = await ctx.legacy.project(table, [
      'id',
      referenceColumn,
      ...Object.values(columns).filter((c): c is string => c !== null),
    ]);

    const winners = new Map<string, string>();
    const times = new Map<string, number>();
    for (const row of projection) {
      const reference = String(row[referenceColumn] ?? '');
      if (!reference) continue;
      const id = String(row['id']);
      const time = timeOf(row, [columns['updated'], columns['created']]);
      const currentTime = times.get(reference);
      if (currentTime === undefined || time >= currentTime) {
        winners.set(reference, id);
        times.set(reference, time);
      }
    }

    const writer = new BatchWriter<ExternalClientRow>(ctx, step, {
      model: 'externalClient',
      createMany: (rows) =>
        ctx.prisma.externalClient.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.externalClient.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);
        if (!key) {
          ctx.report.skipped(step, '(vazio)', 'id-do-cliente-vazio');
          continue;
        }

        const reference = String(read(row, [referenceColumn]) ?? '');
        if (winners.get(reference) !== key) {
          ctx.report.skipped(step, key, 'cliente-duplicado-para-o-usuario', `ref=${reference}`);
          continue;
        }

        const user = await parentId(ctx, 'user', reference);
        if (!user) {
          ctx.report.skipped(step, key, 'usuario-inexistente', `ref=${reference}`);
          continue;
        }

        const cpfCnpj = text(row, ['cpf_cnpj', 'cpfCnpj']);
        const personType = mapPersonType(read(row, ['person_type', 'personType']), cpfCnpj);
        if (personType.fallback) {
          ctx.report.coerced(
            step,
            key,
            'personType-inferido-pelo-documento',
            personType.raw ?? 'null',
          );
        }

        await writer.push({
          // Keeps the payment gateway customer id as primary key, exactly like the legacy row.
          id: key,
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          personType: personType.value,
          externalReference: user,
          cpfCnpj: cpfCnpj ?? '',
          birthDate: requireDate(ctx, step, key, row, ['birth_date', 'birthDate'], 'birthDate'),
          phone: requiredText(row, ['phone'], ''),
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};
