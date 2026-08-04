import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Prisma } from '@repo/db';
import {
  CreatePossiblePartnerCallDto,
  CreatePossiblePartnerDto,
} from './dto/possible-partners.dto';
import { AppException } from '../../common/exceptions/app.exception';

const possiblePartnerInclude = {
  calls: {
    include: {
      caller: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
    orderBy: { created_at: 'desc' as const },
  },
} satisfies Prisma.PossiblePartnerInclude;

@Injectable()
export class PossiblePartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePossiblePartnerDto) {
    const existing = await this.prisma.possiblePartner.findFirst({
      where: {
        delete: false,
        OR: [{ email: dto.email }, { cell: dto.cell }],
      },
    });

    if (existing) {
      throw new AppException('duplicated-data');
    }

    const data: Prisma.PossiblePartnerUncheckedCreateInput = {
      name: dto.name,
      email: dto.email,
      cell: dto.cell,
      delete: false,
      ...(dto.institutionName !== undefined ? { institutionName: dto.institutionName } : {}),
      ...(dto.cnpj !== undefined ? { cnpj: dto.cnpj } : {}),
      ...(dto.modality !== undefined ? { modality: dto.modality } : {}),
      ...(dto.message !== undefined ? { message: dto.message } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.numStudents !== undefined ? { numStudents: dto.numStudents } : {}),
    };

    return this.prisma.possiblePartner.create({ data });
  }

  async findAll() {
    return this.prisma.possiblePartner.findMany({
      where: { delete: false },
      orderBy: { created_at: 'desc' },
      include: possiblePartnerInclude,
    });
  }

  async findOne(id: string) {
    const possiblePartner = await this.prisma.possiblePartner.findUnique({
      where: { id },
      include: possiblePartnerInclude,
    });

    if (!possiblePartner || possiblePartner.delete) {
      throw new AppException('possible-partner-not-found');
    }

    return possiblePartner;
  }

  async createCall(callerId: string, dto: CreatePossiblePartnerCallDto) {
    const possiblePartner = await this.findOne(dto.possible_partner_id);

    if (dto.to_return === false) {
      await this.prisma.possiblePartnerCall.updateMany({
        where: { possible_partner_id: possiblePartner.id },
        data: { to_return: false },
      });
    }

    return this.prisma.possiblePartnerCall.create({
      data: {
        possible_partner_id: possiblePartner.id,
        caller_id: callerId,
        receiver_id: dto.receiver_id || null,
        description: dto.description,
        to_return: dto.to_return ?? false,
      },
    });
  }

  async removeCall(id: string) {
    return this.prisma.possiblePartnerCall.delete({
      where: { id },
    });
  }
}
