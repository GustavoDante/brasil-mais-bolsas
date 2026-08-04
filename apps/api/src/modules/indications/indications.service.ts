import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateIndicationCallDto, CreateIndicationDto } from './dto/indications.dto';

@Injectable()
export class IndicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createIndicationDto: CreateIndicationDto) {
    const { name, email, cell, city } = createIndicationDto;

    const existing = await this.prisma.indication.findFirst({
      where: {
        delete: false,
        OR: [{ email }, { cell }],
      },
    });

    if (existing) {
      throw new BadRequestException('duplicated-data');
    }

    return this.prisma.indication.create({
      data: {
        name,
        email,
        cell,
        city,
        user_id: userId,
      },
    });
  }

  async findOne(id: string) {
    const indication = await this.prisma.indication.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true },
        },
        calls: {
          include: {
            caller: {
              select: { id: true, name: true },
            },
            receiver: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!indication || indication.delete) {
      throw new NotFoundException('indication-not-found');
    }

    return indication;
  }

  async findAll() {
    return this.prisma.indication.findMany({
      where: { delete: false },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
        calls: {
          include: {
            caller: {
              select: { id: true, name: true },
            },
            receiver: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.indication.findMany({
      where: { delete: false, user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        calls: {
          include: {
            caller: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async createCall(callerId: string, createCallDto: CreateIndicationCallDto) {
    const { indication_id, receiver_id, description, to_return } = createCallDto;

    await this.findOne(indication_id);

    if (to_return === false) {
      await this.prisma.indicationCall.updateMany({
        where: { indication_id },
        data: { to_return: false },
      });
    }

    return this.prisma.indicationCall.create({
      data: {
        indication_id,
        caller_id: callerId,
        receiver_id: receiver_id || null,
        description,
        to_return: to_return ?? false,
      },
    });
  }

  async removeCall(id: string) {
    return this.prisma.indicationCall.delete({
      where: { id },
    });
  }
}
