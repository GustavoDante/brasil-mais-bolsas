import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Prisma } from '@repo/db';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import type {
  ChangeOrderScholarshipDto,
  CreateOrderDto,
  OrderListQueryDto,
  UpdateOrderDefaulterDto,
} from './dto/orders.dto';
import { AppException } from '../../common/exceptions/app.exception';

type OrderUser = JwtUser & { institution_id?: string | null };

const orderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      type: true,
    },
  },
  scholarship: {
    include: {
      institution: true,
      course: true,
      signedContracts: true,
    },
  },
  payments: {
    orderBy: { created_at: 'desc' },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    await this.ensureUserExists(dto.user_id);
    await this.ensureScholarshipExists(dto.scholarship_id);

    const existingOrder = await this.prisma.order.findFirst({
      where: {
        user_id: dto.user_id,
        scholarship_id: dto.scholarship_id,
        expired: false,
        is_renew: dto.is_renew === true,
      },
    });

    if (existingOrder) {
      throw new AppException('order-already-exists');
    }

    await this.prisma.order.create({
      data: {
        user_id: dto.user_id,
        scholarship_id: dto.scholarship_id,
        is_renew: dto.is_renew === true,
        code: await this.nextOrderCode(),
      },
    });

    return { ok: true, message: 'order-created' };
  }

  async findAll(user: OrderUser, query: OrderListQueryDto) {
    const where: Prisma.OrderWhereInput = {};

    if (user.type === 'admin') {
      if (query.user_id) where.user_id = query.user_id;
    } else if (user.type === 'manager') {
      const institutionId = await this.resolveManagerInstitutionId(user);
      if (!institutionId) return [];
      where.scholarship = { institution_id: institutionId };
      if (query.user_id) where.user_id = query.user_id;
    } else {
      where.user_id = user.userId;
    }

    if (query.expired !== undefined) where.expired = query.expired;
    if (query.is_renew !== undefined) where.is_renew = query.is_renew;
    if (query.defaulter !== undefined) where.defaulter = query.defaulter;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    return this.prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findById(id: string, user: OrderUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new AppException('order-not-found');
    }

    await this.assertCanAccessOrder(user, order);
    return order;
  }

  async findExpired(user: OrderUser) {
    if (user.type !== 'admin' && user.type !== 'manager') {
      throw new AppException('forbidden');
    }

    const where: Prisma.OrderWhereInput = {
      OR: [{ expired: true }, { is_renew: true }],
    };

    if (user.type === 'manager') {
      const institutionId = await this.resolveManagerInstitutionId(user);
      if (!institutionId) return [];
      where.scholarship = { institution_id: institutionId };
    }

    return this.prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { updated_at: 'desc' },
    });
  }

  async findVoucher(user: OrderUser, scholarshipId: string) {
    const voucher = await this.prisma.order.findFirst({
      where: {
        user_id: user.userId,
        scholarship_id: scholarshipId,
        payments: {
          some: {
            status: 'PAID',
            delete: false,
          },
        },
      },
      include: {
        ...orderInclude,
        payments: {
          where: { status: 'PAID', delete: false },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    return voucher;
  }

  async findPayments(user: OrderUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        scholarship: { select: { institution_id: true } },
        payments: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!order) {
      throw new AppException('order-not-found');
    }

    await this.assertCanAccessOrder(user, order);
    return order.payments;
  }

  async updateDefaulter(user: OrderUser, dto: UpdateOrderDefaulterDto) {
    if (user.type !== 'admin' && user.type !== 'manager') {
      throw new AppException('forbidden');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.order_id },
      include: { scholarship: { select: { institution_id: true } } },
    });

    if (!order) {
      throw new AppException('order-not-found');
    }

    await this.assertCanAccessOrder(user, order);

    await this.prisma.order.update({
      where: { id: dto.order_id },
      data: { defaulter: dto.defaulter },
    });

    return {
      ok: true,
      message: dto.defaulter
        ? 'Pedido marcado como inadimplente'
        : 'Pedido atualizado como adimplente',
    };
  }

  async changeScholarship(dto: ChangeOrderScholarshipDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) {
      throw new AppException('invalid-order');
    }

    const [oldScholarship, newScholarship] = await Promise.all([
      this.prisma.scholarship.findUnique({ where: { id: order.scholarship_id } }),
      this.prisma.scholarship.findUnique({ where: { id: dto.newScholarshipId } }),
    ]);

    if (!oldScholarship) {
      throw new AppException('current-scholarship-not-found');
    }

    const maybeNew = newScholarship as unknown as {
      delete?: boolean;
      active?: boolean;
      expired?: boolean;
    };

    if (
      !newScholarship ||
      maybeNew.delete === true ||
      maybeNew.active === false ||
      maybeNew.expired === true
    ) {
      throw new AppException('invalid-scholarship');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { scholarship_id: newScholarship.id },
    });

    await this.prisma.payment.updateMany({
      where: { order_id: order.id },
      data: {
        scholarship_id: newScholarship.id,
        final_price: newScholarship.final_price,
        discount: newScholarship.discount,
        full_price: newScholarship.full_price,
      },
    });

    await Promise.all([
      this.refreshScholarshipExpiration(oldScholarship.id),
      this.refreshScholarshipExpiration(newScholarship.id),
    ]);

    return updatedOrder;
  }

  async getOrCreateOpenOrder(userId: string, scholarshipId: string, renew: boolean) {
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        user_id: userId,
        scholarship_id: scholarshipId,
        expired: false,
        is_renew: renew,
      },
    });

    if (existingOrder) {
      return existingOrder;
    }

    return this.prisma.order.create({
      data: {
        user_id: userId,
        scholarship_id: scholarshipId,
        is_renew: renew,
        code: await this.nextOrderCode(),
      },
    });
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, delete: true },
    });

    if (!user || (user as { delete?: boolean }).delete) {
      throw new AppException('invalid-user');
    }
  }

  private async ensureScholarshipExists(scholarshipId: string): Promise<void> {
    const scholarship = await this.prisma.scholarship.findFirst({
      where: { id: scholarshipId, delete: false, active: true, expired: false },
      select: { id: true },
    });

    if (!scholarship) {
      throw new AppException('invalid-scholarship');
    }
  }

  private async refreshScholarshipExpiration(scholarshipId: string): Promise<void> {
    const scholarship = await this.prisma.scholarship.findUnique({
      where: { id: scholarshipId },
      select: { id: true, quantity_offered: true },
    });

    if (!scholarship) return;

    const soldCount = await this.prisma.order.count({
      where: {
        scholarship_id: scholarshipId,
        payments: {
          some: {
            status: 'PAID',
            delete: false,
          },
        },
      },
    });

    await this.prisma.scholarship.update({
      where: { id: scholarshipId },
      data: { expired: soldCount >= scholarship.quantity_offered },
    });
  }

  private async assertCanAccessOrder(
    user: OrderUser,
    order: { user_id: string; scholarship?: { institution_id?: string | null } | null },
  ): Promise<void> {
    if (user.type === 'admin') return;

    if (user.type === 'manager') {
      const institutionId = await this.resolveManagerInstitutionId(user);
      if (institutionId && order.scholarship?.institution_id === institutionId) return;
      throw new AppException('forbidden');
    }

    if (order.user_id === user.userId) return;

    throw new AppException('forbidden');
  }

  private async resolveManagerInstitutionId(user: OrderUser): Promise<string | null> {
    if (user.institution_id) return user.institution_id;

    const manager = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { institution_id: true },
    });

    if (!manager || manager.institution_id === undefined) return null;
    return manager.institution_id;
  }

  private async nextOrderCode(): Promise<number> {
    const latestOrder = await this.prisma.order.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    return latestOrder ? latestOrder.code + 1 : 100000;
  }
}
