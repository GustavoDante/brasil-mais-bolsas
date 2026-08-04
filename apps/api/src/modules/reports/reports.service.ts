import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Prisma } from '@repo/db';
import { GeneralReportQueryDto, RenewalsReportQueryDto } from './dto/reports.dto';

const studentReportInclude = {
  orders: {
    include: {
      payments: {
        select: {
          id: true,
          order_id: true,
          status: true,
          payment_type: true,
          user_id: true,
          percent: true,
          created_at: true,
          date_paid: true,
          boleto_expire_date: true,
        },
      },
      scholarship: {
        include: {
          institution: { select: { id: true, name: true } },
          course: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updated_at: 'desc' as const },
  },
  partner: { select: { name: true } },
  callsMade: {
    include: {
      caller: { select: { id: true, name: true } },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies Prisma.UserInclude;

type StudentWithRelations = Prisma.UserGetPayload<{ include: typeof studentReportInclude }>;

type StudentReport = Record<string, unknown> & {
  toCall: boolean;
  callsMade: Array<{
    id: string;
    to_return: boolean;
    caller: {
      id: string;
      name: string;
    };
  }>;
};

type RenewalReportStudent = Record<string, unknown> & {
  order: Record<string, unknown> | null;
  orders: null;
  daysUntilRenewal: number;
  renewalDate: string;
  lastPaymentDate: string;
  callsMade: Array<{
    id: string;
    caller: {
      id: string;
      name: string;
    };
  }>;
};

type ReportUser = {
  userId: string;
  type: string;
  institution_id?: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
}

function getRenewalDate(baseDate: Date) {
  const renewalDate = new Date(baseDate);
  renewalDate.setUTCMonth(renewalDate.getUTCMonth() + 6);
  return renewalDate;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudents(user: ReportUser): Promise<StudentReport[]> {
    const isAdmin = user.type === 'admin';
    const isManager = user.type === 'manager';

    const where: Prisma.UserWhereInput = {
      delete: false,
      type: 'user',
    };

    const students = (await this.prisma.user.findMany({
      where,
      include: {
        ...studentReportInclude,
        orders: {
          ...studentReportInclude.orders,
          where: isManager ? { scholarship: { institution_id: user.institution_id } } : undefined,
        },
      },
      orderBy: { created_at: 'desc' },
    })) as StudentWithRelations[];

    if (isAdmin) {
      return students.map((student): StudentReport => {
        let toCall = false;
        const now = new Date();

        if (student.callsMade.length === 0) {
          if (student.orders.length === 0) {
            toCall = true;
          } else {
            for (const order of student.orders) {
              if (order.payments.length === 0) {
                toCall = true;
                break;
              }
              for (const payment of order.payments) {
                if (
                  payment.payment_type === 'BOLETO' &&
                  payment.status === 'WAITING' &&
                  payment.boleto_expire_date &&
                  now > payment.boleto_expire_date
                ) {
                  toCall = true;
                  break;
                }
              }
              if (toCall) break;
            }
          }
        }

        const { password: _password, ...safeStudent } = student;
        return { ...safeStudent, toCall };
      });
    }

    return students.map((student): StudentReport => {
      const { password: _password, email: _email, phone: _phone, ...safeStudent } = student;
      return { ...safeStudent, toCall: false };
    });
  }

  async getCalled(user: ReportUser): Promise<StudentReport[]> {
    const students = (await this.prisma.user.findMany({
      where: {
        delete: false,
        type: 'user',
        callsMade: {
          some: {
            caller_id: user.userId,
          },
        },
      },
      include: {
        ...studentReportInclude,
        callsMade: {
          include: {
            caller: { select: { id: true, name: true } },
          },
          where: {
            caller_id: user.userId,
          },
          orderBy: { id: 'asc' as const },
        },
      },
      orderBy: { created_at: 'desc' },
    })) as StudentWithRelations[];

    return students.map((student): StudentReport => {
      const { password: _password, email: _email, phone: _phone, ...safeStudent } = student;
      return { ...safeStudent, toCall: false };
    });
  }

  async getToCall(user: ReportUser) {
    const students = await this.getStudents(user);
    return students.filter(
      (student: StudentReport) =>
        student.toCall === true || student.callsMade.some((call) => call.to_return),
    );
  }

  async getRenewals(
    user: ReportUser,
    query: RenewalsReportQueryDto,
  ): Promise<RenewalReportStudent[]> {
    const daysUntilRenewalLimit = query.days ?? 30;
    const isManager = user.type === 'manager';

    const students = (await this.prisma.user.findMany({
      where: {
        delete: false,
        type: 'user',
        orders: isManager
          ? { some: { scholarship: { institution_id: user.institution_id } } }
          : undefined,
      },
      include: {
        ...studentReportInclude,
        orders: {
          ...studentReportInclude.orders,
          where: isManager ? { scholarship: { institution_id: user.institution_id } } : undefined,
        },
        callsMade: {
          include: {
            caller: { select: { id: true, name: true } },
          },
          orderBy: { id: 'asc' as const },
        },
      },
      orderBy: { created_at: 'desc' },
    })) as StudentWithRelations[];

    const now = new Date();
    const renewalStudents: RenewalReportStudent[] = [];

    for (const student of students) {
      const allPaidPayments = student.orders.flatMap((order) =>
        order.payments.filter(
          (payment) =>
            payment.status === 'PAID' && payment.payment_type !== 'INTEREST' && payment.date_paid,
        ),
      );

      if (allPaidPayments.length === 0) {
        continue;
      }

      allPaidPayments.sort((left, right) => {
        const leftDate = left.date_paid ? new Date(left.date_paid).getTime() : 0;
        const rightDate = right.date_paid ? new Date(right.date_paid).getTime() : 0;
        return rightDate - leftDate;
      });

      const lastPayment = allPaidPayments[0];

      if (!lastPayment.date_paid) {
        continue;
      }

      const renewalDate = getRenewalDate(new Date(lastPayment.date_paid));
      const daysUntilRenewal = Math.trunc((renewalDate.getTime() - now.getTime()) / 86_400_000);

      if (daysUntilRenewal < 0 || daysUntilRenewal > daysUntilRenewalLimit) {
        continue;
      }

      const orderWithLastPayment =
        student.orders.find((order) =>
          order.payments.some((payment) => payment.id === lastPayment.id),
        ) ??
        student.orders.find((order) => !order.expired) ??
        student.orders[0] ??
        null;

      const { password: _password, email: _email, phone: _phone, ...safeStudent } = student;

      renewalStudents.push({
        ...safeStudent,
        order: orderWithLastPayment,
        orders: null,
        daysUntilRenewal,
        renewalDate: formatDate(renewalDate),
        lastPaymentDate: formatDate(new Date(lastPayment.date_paid)),
      });
    }

    renewalStudents.sort((left, right) => left.daysUntilRenewal - right.daysUntilRenewal);

    return renewalStudents;
  }

  async getDefaulters(user: ReportUser) {
    const isManager = user.type === 'manager';

    return this.prisma.user.findMany({
      where: {
        delete: false,
        type: 'user',
        orders: {
          some: {
            defaulter: true,
            scholarship: isManager ? { institution_id: user.institution_id } : undefined,
          },
        },
      },
      include: {
        orders: {
          where: { defaulter: true },
          include: {
            payments: true,
            scholarship: {
              include: {
                institution: true,
                course: true,
              },
            },
          },
          orderBy: { updated_at: 'desc' },
        },
        callsMade: {
          include: {
            caller: { select: { name: true } },
          },
        },
      },
    });
  }

  async getGeneralReport(query: GeneralReportQueryDto, userInstitutionId?: string) {
    const { institution, course, start_date, end_date } = query;

    const institutionId = userInstitutionId || (institution !== 'all' ? institution : undefined);

    return this.prisma.payment.findMany({
      where: {
        status: 'PAID',
        date_paid: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
        order: {
          scholarship: {
            institution_id: institutionId,
            course_id: course !== 'all' ? course : undefined,
          },
        },
      },
      include: {
        order: {
          include: {
            user: true,
            scholarship: {
              include: {
                institution: true,
                course: true,
              },
            },
          },
        },
      },
    });
  }

  async getPayments(orderId: string, userId: string): Promise<Array<Record<string, unknown>>> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        user_id: userId,
      },
      include: {
        payments: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('order-not-found');
    }

    return order.payments;
  }

  async getImpactReport(institutionId: string) {
    // Legado usava aggregations. Prisma pode fazer select com _count.
    return this.prisma.scholarship.findMany({
      where: {
        institution_id: institutionId,
        delete: false,
      },
      include: {
        course: true,
        _count: {
          select: {
            payments: {
              where: { status: 'PAID' },
            },
          },
        },
      },
    });
  }
}
