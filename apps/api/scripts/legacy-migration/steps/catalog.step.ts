import type { Prisma } from '@repo/db';
import { BatchWriter, type MigrationContext, type MigrationStep } from '../lib/context';
import { legacyId } from '../lib/ids';
import {
  bool,
  createdAt,
  date,
  decimal,
  integer,
  mapDurationType,
  mapScholarshipType,
  requiredText,
  text,
  updatedAt,
} from '../lib/transforms';
import { legacyKeyOf, parentId, requireDecimal, requireInt, requireText } from './helpers';

type SellerRow = Prisma.SellerCreateManyInput & { id: string };
type PartnerRow = Prisma.PartnerCreateManyInput & { id: string };
type AccessRow = Prisma.AccessCreateManyInput & { id: string };
type InstitutionRow = Prisma.InstitutionCreateManyInput & { id: string };
type CourseCategoryRow = Prisma.CourseCategoryCreateManyInput & { id: string };
type CourseRow = Prisma.CourseCreateManyInput & { id: string };
type ScholarshipRow = Prisma.ScholarshipCreateManyInput & { id: string };

/** Institutions with no (or an orphan) seller are attached to this placeholder seller. */
const FALLBACK_SELLER_ID = legacyId('seller', 'migracao-sem-vendedor');
/** Courses with no (or an orphan) category are attached to this placeholder category. */
const FALLBACK_CATEGORY_ID = legacyId('courseCategory', 'migracao-sem-categoria');

async function ensureFallbackSeller(ctx: MigrationContext): Promise<string> {
  if (await ctx.ids.has('seller', FALLBACK_SELLER_ID)) return FALLBACK_SELLER_ID;

  if (!ctx.config.dryRun) {
    const data = {
      id: FALLBACK_SELLER_ID,
      name: 'Sem vendedor (migração legado)',
      email: 'sem-vendedor@migrado.brasilmaisbolsas.local',
      active: false,
      delete: false,
    };
    await ctx.prisma.seller.upsert({ where: { id: FALLBACK_SELLER_ID }, create: data, update: {} });
  }

  await ctx.ids.add('seller', [FALLBACK_SELLER_ID]);
  return FALLBACK_SELLER_ID;
}

async function ensureFallbackCategory(ctx: MigrationContext): Promise<string> {
  if (await ctx.ids.has('courseCategory', FALLBACK_CATEGORY_ID)) return FALLBACK_CATEGORY_ID;

  if (!ctx.config.dryRun) {
    const data = {
      id: FALLBACK_CATEGORY_ID,
      name: 'Sem categoria (migração legado)',
      active: false,
      delete: false,
    };
    await ctx.prisma.courseCategory.upsert({
      where: { id: FALLBACK_CATEGORY_ID },
      create: data,
      update: {},
    });
  }

  await ctx.ids.add('courseCategory', [FALLBACK_CATEGORY_ID]);
  return FALLBACK_CATEGORY_ID;
}

export const sellersStep: MigrationStep = {
  name: 'sellers',
  description: 'sellers -> Seller',
  sources: ['sellers', 'Sellers'],
  async run(ctx, table) {
    const step = 'sellers';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<SellerRow>(ctx, step, {
      model: 'seller',
      createMany: (rows) => ctx.prisma.seller.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.seller.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);
        await writer.push({
          id: legacyId('seller', key),
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          email: requireText(ctx, step, key, row, ['email'], 'email'),
          password: requiredText(row, ['password'], '123123'),
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

export const partnersStep: MigrationStep = {
  name: 'partners',
  description: 'partners -> Partner (código único normalizado)',
  sources: ['partners', 'Partners'],
  async run(ctx, table) {
    const step = 'partners';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const usedCodes = new Set<string>();

    const writer = new BatchWriter<PartnerRow>(ctx, step, {
      model: 'partner',
      createMany: (rows) => ctx.prisma.partner.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.partner.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        // `code` is UNIQUE in the new schema; keep the first occurrence and suffix the rest.
        let code = text(row, ['code']) ?? `legacy-${key}`;
        if (usedCodes.has(code)) {
          const original = code;
          code = `${original}-legacy${key}`;
          ctx.report.renamed(step, key, 'codigo-duplicado', `${original} -> ${code}`);
        }
        usedCodes.add(code);

        await writer.push({
          id: legacyId('partner', key),
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          code,
          password: requiredText(row, ['password'], '123123'),
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

export const accessesStep: MigrationStep = {
  name: 'accesses',
  description: 'accesses -> Access',
  sources: ['accesses', 'Accesses'],
  async run(ctx, table) {
    const step = 'accesses';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<AccessRow>(ctx, step, {
      model: 'access',
      createMany: (rows) => ctx.prisma.access.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.access.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const partner = await parentId(ctx, 'partner', row['partner_id']);
        if (!partner) {
          ctx.report.skipped(step, key, 'parceiro-inexistente', String(row['partner_id'] ?? ''));
          continue;
        }

        await writer.push({
          id: legacyId('access', key),
          partner_id: partner,
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const institutionsStep: MigrationStep = {
  name: 'institutions',
  description: 'institutions -> Institution (seller_id obrigatório)',
  sources: ['institutions', 'Institutions'],
  async run(ctx, table) {
    const step = 'institutions';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<InstitutionRow>(ctx, step, {
      model: 'institution',
      createMany: (rows) => ctx.prisma.institution.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.institution.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        let seller = await parentId(ctx, 'seller', row['seller_id']);
        if (!seller) {
          seller = await ensureFallbackSeller(ctx);
          ctx.report.coerced(
            step,
            key,
            'vendedor-inexistente-usando-placeholder',
            String(row['seller_id'] ?? ''),
          );
        }

        await writer.push({
          id: legacyId('institution', key),
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          description: requireText(ctx, step, key, row, ['description'], 'description'),
          image: requireText(ctx, step, key, row, ['image'], 'image'),
          cnpj: requireText(ctx, step, key, row, ['cnpj'], 'cnpj'),
          email: text(row, ['email']),
          email_2: text(row, ['email_2']),
          phone: requireText(ctx, step, key, row, ['phone'], 'phone'),
          phone_2: text(row, ['phone_2']),
          phone_3: text(row, ['phone_3']),
          owner_name: requireText(ctx, step, key, row, ['owner_name'], 'owner_name'),
          owner_phone: text(row, ['owner_phone']),
          owner_secondary_phone: text(row, ['owner_secondary_phone']),
          owner_birthdate: date(row, ['owner_birthdate']),
          operator_name: requiredText(row, ['operator_name'], ''),
          operator_phone: text(row, ['operator_phone']),
          operator_birthdate: date(row, ['operator_birthdate']),
          operator_2_name: text(row, ['operator_2_name']),
          operator_2_phone: text(row, ['operator_2_phone']),
          operator_2_birthdate: date(row, ['operator_2_birthdate']),
          street: requireText(ctx, step, key, row, ['street'], 'street'),
          number: requireText(ctx, step, key, row, ['number'], 'number'),
          district: requireText(ctx, step, key, row, ['district'], 'district'),
          city: requireText(ctx, step, key, row, ['city'], 'city'),
          state: requireText(ctx, step, key, row, ['state'], 'state'),
          postal_code: requireText(ctx, step, key, row, ['postal_code'], 'postal_code'),
          students_count: integer(row, ['students_count']) ?? 0,
          observations: text(row, ['observations']),
          old_id: text(row, ['old_id']),
          fake: bool(row, ['fake'], false),
          active: bool(row, ['active'], true),
          delete: bool(row, ['delete'], false),
          seller_id: seller,
          created_at: createdAt(row),
          updated_at: updatedAt(row),
        });
      }
    }

    await writer.flush();
  },
};

export const courseCategoriesStep: MigrationStep = {
  name: 'course-categories',
  description: 'course_categories -> CourseCategory',
  sources: ['course_categories', 'CourseCategories'],
  async run(ctx, table) {
    const step = 'course-categories';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<CourseCategoryRow>(ctx, step, {
      model: 'courseCategory',
      createMany: (rows) =>
        ctx.prisma.courseCategory.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.courseCategory.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);
        await writer.push({
          id: legacyId('courseCategory', key),
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          old_id: text(row, ['old_id']),
          order: integer(row, ['order']),
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

export const coursesStep: MigrationStep = {
  name: 'courses',
  description: 'courses -> Course (duration_type -> enum DurationType)',
  sources: ['courses', 'Courses'],
  async run(ctx, table) {
    const step = 'courses';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<CourseRow>(ctx, step, {
      model: 'course',
      createMany: (rows) => ctx.prisma.course.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.course.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        let category = await parentId(ctx, 'courseCategory', row['category_id']);
        if (!category) {
          category = await ensureFallbackCategory(ctx);
          ctx.report.coerced(
            step,
            key,
            'categoria-inexistente-usando-placeholder',
            String(row['category_id'] ?? ''),
          );
        }

        const duration = mapDurationType(row['duration_type']);
        if (duration.fallback) {
          ctx.report.coerced(step, key, 'duration_type-desconhecido', duration.raw ?? 'null');
        }

        await writer.push({
          id: legacyId('course', key),
          name: requireText(ctx, step, key, row, ['name'], 'name'),
          duration: requireInt(ctx, step, key, row, ['duration'], 'duration'),
          duration_type: duration.value,
          category_id: category,
          old_id: text(row, ['old_id']),
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

export const scholarshipsStep: MigrationStep = {
  name: 'scholarships',
  description: 'scholarships -> Scholarship (type -> enum, FLOAT -> DECIMAL(12,2))',
  sources: ['scholarships', 'Scholarships'],
  async run(ctx, table) {
    const step = 'scholarships';
    const stat = ctx.report.stat(step);
    stat.legacyRows = await ctx.legacy.count(table);

    const writer = new BatchWriter<ScholarshipRow>(ctx, step, {
      model: 'scholarship',
      createMany: (rows) => ctx.prisma.scholarship.createMany({ data: rows, skipDuplicates: true }),
      upsert: (row) =>
        ctx.prisma.scholarship.upsert({ where: { id: row.id }, create: row, update: row }),
    });

    for await (const batch of ctx.legacy.stream(table, ctx.config)) {
      for (const row of batch) {
        stat.read += 1;
        const key = legacyKeyOf(row);

        const course = await parentId(ctx, 'course', row['course_id']);
        const institution = await parentId(ctx, 'institution', row['institution_id']);

        // course_id / institution_id are NOT NULL + RESTRICT in the new schema: without a
        // valid parent the row cannot exist, and its orders/payments are skipped as well.
        if (!course || !institution) {
          ctx.report.skipped(
            step,
            key,
            !course ? 'curso-inexistente' : 'instituicao-inexistente',
            `course_id=${String(row['course_id'] ?? '')} institution_id=${String(row['institution_id'] ?? '')}`,
          );
          continue;
        }

        const type = mapScholarshipType(row['type']);
        if (type.fallback) {
          ctx.report.coerced(step, key, 'type-desconhecido', type.raw ?? 'null');
        }

        // register_period_start is NOT NULL in the new schema.
        const registerStart = date(row, ['register_period_start']);
        if (!registerStart) {
          ctx.report.coerced(step, key, 'register_period_start-vazio-usando-created_at');
        }

        await writer.push({
          id: legacyId('scholarship', key),
          shift: requireText(ctx, step, key, row, ['shift'], 'shift'),
          type: type.value,
          full_price: requireDecimal(ctx, step, key, row, ['full_price'], 'full_price'),
          discount: requireDecimal(ctx, step, key, row, ['discount'], 'discount'),
          final_price: requireDecimal(ctx, step, key, row, ['final_price'], 'final_price'),
          is_yearly: bool(row, ['is_yearly'], false),
          registration_fee: decimal(row, ['registration_fee']),
          adhesion_fee: decimal(row, ['adhesion_fee']),
          registration_fee_discount: decimal(row, ['registration_fee_discount']),
          installments: integer(row, ['installments']),
          quantity_offered: requireInt(
            ctx,
            step,
            key,
            row,
            ['quantity_offered'],
            'quantity_offered',
          ),
          renovation_days: requireInt(ctx, step, key, row, ['renovation_days'], 'renovation_days'),
          register_period_start: registerStart ?? createdAt(row),
          register_period_end: date(row, ['register_period_end']),
          course_description: requireText(
            ctx,
            step,
            key,
            row,
            ['course_description'],
            'course_description',
          ),
          period: text(row, ['period']),
          liberado_por_qtd_indicacao: integer(row, ['liberado_por_qtd_indicacao']),
          expired: bool(row, ['expired'], false),
          course_id: course,
          institution_id: institution,
          old_id: text(row, ['old_id']),
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
