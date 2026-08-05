import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreateSellerDto,
  SellersQueryDto,
  UpdateSellerDto,
  SellerLoginDto,
} from './dto/sellers.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSellerDto) {
    const existing = await this.prisma.seller.findFirst({
      where: { email: dto.email, delete: false },
    });
    if (existing) {
      throw new AppException('seller-email-already-taken');
    }

    return this.prisma.seller.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
      },
    });
  }

  async findAll(query: SellersQueryDto) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.startDate && query.endDate) {
      const [sMonth, sDay, sYear] = query.startDate.split('-');
      startDate = new Date(parseInt(sYear), parseInt(sMonth) - 1, parseInt(sDay));
      startDate.setHours(0, 0, 0, 0);

      const [eMonth, eDay, eYear] = query.endDate.split('-');
      endDate = new Date(parseInt(eYear), parseInt(eMonth) - 1, parseInt(eDay));
      endDate.setHours(23, 59, 59, 999);
    }

    const sellers = await this.prisma.seller.findMany({
      where: { delete: false },
      select: {
        id: true,
        name: true,
        active: true,
        institutions: {
          where: { delete: false },
          select: {
            id: true,
            name: true,
            created_at: true,
            scholarships: {
              where: { delete: false },
              select: {
                _count: {
                  select: {
                    payments: {
                      where: {
                        status: 'PAID',
                        delete: false,
                        ...(startDate && endDate
                          ? { created_at: { gte: startDate, lte: endDate } }
                          : {}),
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return sellers.map((seller) => {
      let students_count = 0;
      seller.institutions.forEach((inst) => {
        inst.scholarships.forEach((sch) => {
          students_count += sch._count.payments;
        });
      });

      return {
        id: seller.id,
        name: seller.name,
        active: seller.active,
        institutions: seller.institutions.map((i) => ({
          id: i.id,
          name: i.name,
          createdAt: i.created_at,
        })),
        students_count,
      };
    });
  }

  async login(dto: SellerLoginDto, query: SellersQueryDto) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.startDate && query.endDate) {
      const [sMonth, sDay, sYear] = query.startDate.split('-');
      startDate = new Date(parseInt(sYear), parseInt(sMonth) - 1, parseInt(sDay));
      startDate.setHours(0, 0, 0, 0);

      const [eMonth, eDay, eYear] = query.endDate.split('-');
      endDate = new Date(parseInt(eYear), parseInt(eMonth) - 1, parseInt(eDay));
      endDate.setHours(23, 59, 59, 999);
    }

    const seller = await this.prisma.seller.findFirst({
      where: {
        email: dto.email,
        password: dto.password,
        delete: false,
        active: true,
      },
      select: {
        id: true,
        name: true,
        active: true,
        institutions: {
          where: { delete: false },
          select: {
            id: true,
            name: true,
            created_at: true,
            scholarships: {
              where: { delete: false },
              select: {
                _count: {
                  select: {
                    payments: {
                      where: {
                        status: 'PAID',
                        delete: false,
                        ...(startDate && endDate
                          ? { created_at: { gte: startDate, lte: endDate } }
                          : {}),
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!seller) {
      throw new AppException('seller-not-found');
    }

    let students_count = 0;
    seller.institutions.forEach((inst) => {
      inst.scholarships.forEach((sch) => {
        students_count += sch._count.payments;
      });
    });

    return {
      id: seller.id,
      name: seller.name,
      active: seller.active,
      institutions: seller.institutions.map((i) => ({
        id: i.id,
        name: i.name,
        createdAt: i.created_at,
      })),
      students_count,
    };
  }

  async findOne(id: string) {
    const seller = await this.prisma.seller.findFirst({
      where: { id, delete: false },
    });
    if (!seller) throw new AppException('seller-not-found');
    return seller;
  }

  async update(id: string, dto: UpdateSellerDto) {
    const seller = await this.findOne(id);
    return this.prisma.seller.update({
      where: { id: seller.id },
      data: dto,
    });
  }

  async remove(id: string) {
    const seller = await this.findOne(id);
    return this.prisma.seller.update({
      where: { id: seller.id },
      data: { delete: true },
    });
  }

  async toggleActive(id: string) {
    const seller = await this.findOne(id);
    return this.prisma.seller.update({
      where: { id: seller.id },
      data: { active: !seller.active },
    });
  }
}
