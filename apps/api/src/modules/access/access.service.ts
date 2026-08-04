import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateAccessDto } from './dto/access.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAccessDto) {
    const partner = await this.prisma.partner.findUnique({ where: { id: dto.partner_id } });
    if (!partner) throw new AppException('partner-not-found');

    return this.prisma.access.create({ data: { partner_id: partner.id } });
  }

  async findAll() {
    return this.prisma.access.findMany({
      where: {},
      include: { partner: { select: { id: true, name: true, code: true } } },
    });
  }

  async remove(id: string) {
    return this.prisma.access.delete({ where: { id } });
  }
}
