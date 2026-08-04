import { Injectable } from '@nestjs/common';
import { Prisma, ScholarshipType } from '@repo/db';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  ChangeScholarshipOrderDto,
  CreateScholarshipDto,
  ScholarshipListQueryDto,
  UpdateScholarshipDto,
} from './dto/scholarships.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class ScholarshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateScholarshipDto) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: createDto.institution_id },
    });
    if (!institution || institution.delete)
      throw new AppException('invalid-institution');

    const course = await this.prisma.course.findUnique({ where: { id: createDto.course_id } });
    if (!course || course.delete)
      throw new AppException('invalid-course');

    const final_price = Number(
      (createDto.full_price - (createDto.full_price * createDto.discount) / 100).toFixed(2),
    );

    const scholarshipData: Prisma.ScholarshipUncheckedCreateInput = {
      shift: createDto.shift,
      type: createDto.type,
      full_price: new Prisma.Decimal(createDto.full_price),
      discount: new Prisma.Decimal(createDto.discount),
      final_price: new Prisma.Decimal(final_price),
      quantity_offered: createDto.quantity_offered,
      renovation_days: createDto.renovation_days,
      period: createDto.course_period ? JSON.stringify(createDto.course_period) : null,
      register_period_start: createDto.register_period_start,
      register_period_end: createDto.register_period_end,
      course_description: createDto.course_description,
      institution_id: createDto.institution_id,
      course_id: createDto.course_id,
      old_id: createDto.old_id || '',
      active: createDto.active !== false,
      delete: createDto.delete === true,
      expired: createDto.expired === true,
      is_yearly: createDto.is_yearly || false,
      registration_fee: createDto.registration_fee
        ? new Prisma.Decimal(createDto.registration_fee)
        : null,
      adhesion_fee: createDto.adhesion_fee ? new Prisma.Decimal(createDto.adhesion_fee) : null,
      registration_fee_discount: createDto.registration_fee_discount
        ? new Prisma.Decimal(createDto.registration_fee_discount)
        : null,
      installments: createDto.installments || null,
    };

    return this.prisma.scholarship.create({ data: scholarshipData });
  }

  async findAllForManager(institution_id?: string) {
    const where: Prisma.ScholarshipWhereInput = { delete: false, expired: false };
    if (institution_id) {
      where.institution_id = institution_id;
    }
    return this.prisma.scholarship.findMany({
      where,
      include: { course: true, institution: true },
    });
  }

  async listBackoffice(
    user: { type: string; institution_id?: string },
    query: ScholarshipListQueryDto,
  ) {
    const showExpired = query.showExpired === 'true';
    const showInativas = query.showInativas === 'true';

    const where: Prisma.ScholarshipWhereInput = { delete: false };
    if (!showExpired) where.expired = false;
    if (showInativas) where.active = true;

    if (user.type === 'manager' && user.institution_id) {
      where.institution_id = user.institution_id;
    }

    const items = await this.prisma.scholarship.findMany({
      where,
      include: {
        course: true,
        institution: { include: { seller: true } },
        _count: { select: { payments: { where: { status: 'PAID' } } } },
      },
      orderBy: { course: { id: 'asc' } },
    });

    return items.map((s) => ({
      ...s,
      institution_name: s.institution?.name,
      institution_city: s.institution?.city,
      institution_district: s.institution?.district,
      seller_id: s.institution?.seller_id,
      seller_name: s.institution?.seller?.name,
      course_name: s.course?.name,
      quantity_sold: s._count.payments,
      _count: undefined,
    }));
  }

  async getStudentsCount(id: string) {
    const count = await this.prisma.payment.count({
      where: {
        status: 'PAID',
        order: { scholarship_id: id },
      },
    });
    return count;
  }

  async findById(id: string) {
    const scholarship = await this.prisma.scholarship.findUnique({
      where: { id },
      include: { course: true, institution: true },
    });
    if (!scholarship || scholarship.delete) throw new AppException('scholarship-not-found');
    return scholarship;
  }

  async findByOldId(old_id: string) {
    const scholarship = await this.prisma.scholarship.findFirst({
      where: { old_id },
      include: { course: true, institution: true },
    });
    if (!scholarship) throw new AppException('scholarship-not-found');
    return scholarship;
  }

  async getContractInfo(id: string, userId: string) {
    const scholarship = await this.findById(id);

    const signedContract = await this.prisma.signedContract.findFirst({
      where: { scholarship_id: id, user_id: userId },
    });

    const order = await this.prisma.order.findFirst({
      where: { scholarship_id: id, user_id: userId },
      include: {
        payments: {
          where: { status: 'PAID' },
        },
      },
    });

    return { scholarship, signedContract, order };
  }

  async update(id: string, updateDto: UpdateScholarshipDto) {
    const scholarship = await this.prisma.scholarship.findUnique({ where: { id } });
    if (!scholarship || scholarship.delete) throw new AppException('scholarship-not-found');

    const updateData: Prisma.ScholarshipUpdateInput = {};

    if (updateDto.shift) updateData.shift = updateDto.shift;
    if (updateDto.type) updateData.type = updateDto.type;
    if (updateDto.active !== undefined) updateData.active = updateDto.active;

    let current_full_price = Number(scholarship.full_price);
    let current_discount = Number(scholarship.discount);

    if (updateDto.full_price !== undefined) {
      updateData.full_price = new Prisma.Decimal(updateDto.full_price);
      current_full_price = updateDto.full_price;
    }
    if (updateDto.discount !== undefined) {
      updateData.discount = new Prisma.Decimal(updateDto.discount);
      current_discount = updateDto.discount;
    }

    const final_price = (
      current_full_price -
      (current_full_price * current_discount) / 100
    ).toFixed(2);
    updateData.final_price = new Prisma.Decimal(final_price);

    if (updateDto.quantity_offered !== undefined)
      updateData.quantity_offered = updateDto.quantity_offered;
    if (updateDto.renovation_days !== undefined)
      updateData.renovation_days = updateDto.renovation_days;
    if (updateDto.register_period_start)
      updateData.register_period_start = updateDto.register_period_start;
    if (updateDto.register_period_end)
      updateData.register_period_end = updateDto.register_period_end;
    if (updateDto.course_description) updateData.course_description = updateDto.course_description;
    if (updateDto.course_period) updateData.period = JSON.stringify(updateDto.course_period);
    if (updateDto.is_yearly !== undefined) updateData.is_yearly = updateDto.is_yearly;
    if (updateDto.registration_fee !== undefined)
      updateData.registration_fee = new Prisma.Decimal(updateDto.registration_fee);
    if (updateDto.adhesion_fee !== undefined)
      updateData.adhesion_fee = new Prisma.Decimal(updateDto.adhesion_fee);
    if (updateDto.registration_fee_discount !== undefined)
      updateData.registration_fee_discount = new Prisma.Decimal(
        updateDto.registration_fee_discount,
      );
    if (updateDto.installments !== undefined) updateData.installments = updateDto.installments;

    const quantitySold = await this.getStudentsCount(id);
    const totalOffered = updateDto.quantity_offered ?? scholarship.quantity_offered;
    updateData.expired = quantitySold >= totalOffered;

    return this.prisma.scholarship.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string) {
    const scholarship = await this.prisma.scholarship.findUnique({ where: { id } });
    if (!scholarship || scholarship.delete) throw new AppException('scholarship-not-found');
    return this.prisma.scholarship.update({
      where: { id },
      data: { delete: true, active: false },
    });
  }

  async toggleActive(id: string) {
    const scholarship = await this.prisma.scholarship.findUnique({
      where: { id, delete: false },
    });
    if (!scholarship) throw new AppException('scholarship-not-found');
    return this.prisma.scholarship.update({
      where: { id },
      data: { active: !scholarship.active },
    });
  }

  async changeOrderScholarship(dto: ChangeScholarshipOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.order_id } });
    if (!order)
      throw new AppException('invalid-order');

    const scholarship = await this.prisma.scholarship.findUnique({
      where: { id: dto.new_scholarship },
    });
    if (!scholarship)
      throw new AppException('invalid-scholarship');

    await this.prisma.payment.updateMany({
      where: { order_id: order.id },
      data: {
        final_price: scholarship.final_price,
        discount: scholarship.discount,
        full_price: scholarship.full_price,
      },
    });

    return order;
  }

  /**
   * Vitrine da home: por instituição, a menor mensalidade e o maior desconto disponíveis.
   *
   * Os identificadores estavam no padrão do banco antigo (`institutions`, `scholarships`),
   * que não existe no schema novo — a rota respondia 500. Agora usa as tabelas do Prisma
   * (`"Institution"`, `"Scholarship"`), com `"delete"` entre aspas por ser palavra reservada.
   */
  async getIndexList() {
    const sql = Prisma.sql`
      SELECT
        institution.id,
        institution.name,
        institution.image,
        lowest_value.final_price,
        highest_discount.discount
      FROM "Institution" AS institution
      INNER JOIN "Scholarship" AS lowest_value ON lowest_value.id = (
        SELECT s2.id FROM "Scholarship" AS s2
        WHERE s2.institution_id = institution.id
          AND s2.active = true AND s2."delete" = false AND s2.expired = false
        ORDER BY s2.full_price ASC LIMIT 1
      )
      INNER JOIN "Scholarship" AS highest_discount ON highest_discount.id = (
        SELECT s3.id FROM "Scholarship" AS s3
        WHERE s3.institution_id = institution.id
          AND s3.active = true AND s3."delete" = false AND s3.expired = false
        ORDER BY s3.discount DESC LIMIT 1
      )
      WHERE institution.active = true AND institution."delete" = false
      ORDER BY RANDOM()
      LIMIT 20
    `;

    return this.prisma.$queryRaw(sql);
  }

  /**
   * Cidades com bolsas ativas que combinam com o termo.
   *
   * Reescrito em Prisma: o SQL cru anterior apontava para as tabelas do banco antigo
   * (`institutions`/`scholarships`) e dependia da extensão `unaccent`, que não está
   * instalada — a rota respondia 500. A busca agora é case-insensitive, igual às demais
   * (`searchInstitution`/`searchCourse`).
   */
  async searchCity(term: string) {
    return this.prisma.institution
      .findMany({
        where: {
          delete: false,
          active: true,
          city: { contains: term ?? '', mode: 'insensitive' },
          scholarships: { some: { delete: false, active: true, expired: false } },
        },
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      })
      .then((rows) => rows.map((row) => ({ name: row.city })));
  }

  async listCity() {
    return this.prisma.institution
      .findMany({
        where: {
          delete: false,
          active: true,
          scholarships: { some: { delete: false, active: true, expired: false } },
        },
        select: { city: true },
        distinct: ['city'],
      })
      .then((res) => res.map((r) => ({ name: r.city })));
  }

  async searchInstitution(term: string) {
    return this.prisma.institution.findMany({
      where: {
        delete: false,
        active: true,
        name: { contains: term, mode: 'insensitive' },
        scholarships: { some: { delete: false, active: true, expired: false } },
      },
      select: { id: true, name: true },
      distinct: ['id', 'name'],
    });
  }

  async listInstitutionByCity(city: string, categoryId: string) {
    return this.prisma.institution.findMany({
      where: {
        delete: false,
        active: true,
        city: { contains: city, mode: 'insensitive' },
        scholarships: {
          some: {
            delete: false,
            active: true,
            expired: false,
            course: { category_id: categoryId },
          },
        },
      },
      select: { id: true, name: true },
      distinct: ['id', 'name'],
    });
  }

  async listCourseByCity(city: string, categoryId: string) {
    return this.prisma.course.findMany({
      where: {
        delete: false,
        active: true,
        category_id: categoryId,
        scholarships: {
          some: {
            delete: false,
            active: true,
            expired: false,
            institution: { city: { contains: city, mode: 'insensitive' } },
          },
        },
      },
      select: { id: true, name: true },
      distinct: ['id', 'name'],
    });
  }

  async searchCourse(term: string) {
    return this.prisma.course.findMany({
      where: {
        delete: false,
        active: true,
        name: { contains: term, mode: 'insensitive' },
        scholarships: { some: { delete: false, active: true, expired: false } },
      },
      select: { id: true, name: true },
      distinct: ['id', 'name'],
    });
  }

  async listRandom(query: ScholarshipListQueryDto) {
    const where: Prisma.ScholarshipWhereInput = { delete: false, active: true, expired: false };

    if (query.alreadyListed && Array.isArray(query.alreadyListed)) {
      where.id = { notIn: query.alreadyListed };
    }
    if (query.type && query.type !== 'todos')
      where.type = query.type as Prisma.EnumScholarshipTypeFilter<'Scholarship'> | ScholarshipType;

    const institutionQuery: Prisma.InstitutionWhereInput = { active: true };
    if (query.institution) institutionQuery.id = query.institution;
    if (query.city) institutionQuery.city = { contains: query.city, mode: 'insensitive' };
    where.institution = institutionQuery;

    const courseQuery: Prisma.CourseWhereInput = {};
    if (query.category) courseQuery.category_id = query.category;
    if (query.course) courseQuery.id = query.course;
    where.course = courseQuery;

    const items = await this.prisma.scholarship.findMany({
      where,
      include: {
        course: true,
        institution: { select: { id: true, name: true, image: true, city: true, district: true } },
        _count: { select: { payments: { where: { status: 'PAID' } } } },
      },
      take: 200,
      // Pegar um pool razoável para depois embaralhar em memória (ou usar queryRaw para ORDER BY RANDOM() puro)
    });

    // Randomize in memory (since Prisma doesn't have order by random native across relations easily)
    const shuffled = items.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return selected.map((s) => ({
      ...s,
      payments_count: s._count.payments,
      _count: undefined,
    }));
  }

  async listOrder(query: ScholarshipListQueryDto) {
    const where: Prisma.ScholarshipWhereInput = { delete: false, active: true, expired: false };
    if (query.alreadyListed && Array.isArray(query.alreadyListed)) {
      where.id = { notIn: query.alreadyListed };
    }
    if (query.type && query.type !== 'todos')
      where.type = query.type as Prisma.EnumScholarshipTypeFilter<'Scholarship'> | ScholarshipType;

    const institutionQuery: Prisma.InstitutionWhereInput = { active: true };
    if (query.institution)
      institutionQuery.name = { contains: query.institution, mode: 'insensitive' };
    if (query.city) institutionQuery.city = { contains: query.city, mode: 'insensitive' };
    where.institution = institutionQuery;

    const courseQuery: Prisma.CourseWhereInput = {};
    if (query.category) {
      const cat = await this.prisma.courseCategory.findFirst({
        where: { name: { equals: query.category, mode: 'insensitive' } },
      });
      if (cat) courseQuery.category_id = cat.id;
    }
    if (query.course) courseQuery.name = { contains: query.course, mode: 'insensitive' };
    where.course = courseQuery;

    const scholarships = await this.prisma.scholarship.findMany({
      where,
      include: {
        course: true,
        institution: { select: { id: true, name: true, image: true, city: true, district: true } },
        _count: { select: { payments: { where: { status: 'PAID' } } } },
      },
      orderBy: [
        { course: { category_id: 'asc' } },
        { course: { id: 'asc' } },
        { institution: { name: 'asc' } },
      ],
    });

    return scholarships.map((s) => ({
      ...s,
      payments_count: s._count.payments,
      _count: undefined,
    }));
  }

  async listAll(query: ScholarshipListQueryDto) {
    const rawList = await this.listOrder(query); // Usa a mesma lógica base de listOrder, com pequenos ajustes
    let categoryName = 'Todos';
    if (query.category) {
      const cat = await this.prisma.courseCategory.findFirst({
        where: { name: { contains: query.category, mode: 'insensitive' } },
      });
      if (cat) categoryName = cat.name;
    }

    return rawList
      .map((s) => {
        const quantity = s.quantity_offered - (s.payments_count || 0);
        return {
          id: s.id,
          shift: s.shift,
          type: s.type,
          full_price: 'R$ ' + Number(s.full_price).toFixed(2),
          discount: Number(s.discount) + '%',
          final_price: 'R$ ' + Number(s.final_price).toFixed(2),
          is_yearly: s.is_yearly,
          registration_fee: s.registration_fee,
          adhesion_fee: s.adhesion_fee,
          installments: s.installments,
          registration_fee_discount: s.registration_fee_discount,
          course_name: s.course?.name,
          course_duration:
            s.course?.duration + ' ' + (s.course?.duration_type === 'MONTHS' ? 'meses' : 'anos'),
          institution_city: s.institution?.city,
          institution_name: s.institution?.name,
          category: categoryName,
          quantity:
            quantity <= 5
              ? quantity <= 1
                ? '1 bolsa restante'
                : quantity + ' bolsas restantes'
              : 'Últimas vagas',
        };
      })
      .sort(() => 0.5 - Math.random());
  }
}
