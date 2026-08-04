import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreatePartnerDto,
  PartnerLoginDto,
  PartnersQueryDto,
  RegisterAccessDto,
  UpdatePartnerDto,
} from './dto/partners.dto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePartnerDto) {
    const existing = await this.prisma.partner.findFirst({
      where: { code: dto.code, delete: false },
    });
    if (existing) {
      throw new BadRequestException('Partner code already exists');
    }

    return this.prisma.partner.create({
      data: {
        name: dto.name,
        code: dto.code,
        password: dto.password,
      },
    });
  }

  async findAll(query: PartnersQueryDto) {
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

    const partners = await this.prisma.partner.findMany({
      where: { delete: false },
      select: {
        id: true,
        name: true,
        active: true,
        users: {
          where: {
            delete: false,
            ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {}),
          },
          select: {
            id: true,
            _count: {
              select: {
                payments: {
                  where: { status: 'PAID', delete: false },
                },
              },
            },
          },
        },
      },
    });

    return partners
      .map((p) => {
        // UsersCount é a quantidade de usuários que têm pelo menos um pagamento PAID
        const UsersCount = p.users.filter((u) => u._count.payments > 0).length;
        return {
          id: p.id,
          name: p.name,
          active: p.active,
          UsersCount,
        };
      })
      .sort((a, b) => b.UsersCount - a.UsersCount);
  }

  async login(dto: PartnerLoginDto, query: PartnersQueryDto) {
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

    const partner = await this.prisma.partner.findFirst({
      where: {
        code: dto.code.toLowerCase(),
        password: dto.password,
        delete: false,
        active: true,
      },
      select: {
        id: true,
        name: true,
        active: true,
        users: {
          where: {
            delete: false,
            ...(startDate && endDate ? { created_at: { gte: startDate, lte: endDate } } : {}),
          },
          select: {
            id: true,
            _count: {
              select: {
                payments: {
                  where: { status: 'PAID', delete: false },
                },
              },
            },
          },
        },
      },
    });

    if (!partner) {
      throw new BadRequestException({
        ok: false,
        message: 'partner-not-found',
        userMessage: 'Usuário não encontrado',
      });
    }

    const UsersCount = partner.users.filter((u) => u._count.payments > 0).length;

    return {
      id: partner.id,
      name: partner.name,
      active: partner.active,
      UsersCount,
    };
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { id, delete: false },
    });
    if (!partner) throw new BadRequestException('partner-not-found');
    return partner;
  }

  async update(id: string, dto: UpdatePartnerDto) {
    const partner = await this.findOne(id);
    return this.prisma.partner.update({
      where: { id: partner.id },
      data: dto,
    });
  }

  async remove(id: string) {
    const partner = await this.findOne(id);
    return this.prisma.partner.update({
      where: { id: partner.id },
      data: { delete: true },
    });
  }

  async toggleActive(id: string) {
    const partner = await this.findOne(id);
    return this.prisma.partner.update({
      where: { id: partner.id },
      data: { active: !partner.active },
    });
  }

  async registerAccess(dto: RegisterAccessDto) {
    const partner = await this.prisma.partner.findFirst({
      where: { code: dto.partner_code },
    });
    if (!partner) return;

    await this.prisma.access.create({
      data: {
        partner_id: partner.id,
      },
    });
  }
}
