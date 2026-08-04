import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Prisma } from '@repo/db';
import { CreateCallDto, UpdateCallDto } from './dto/calls.dto';

const callInclude = {
  caller: { select: { id: true, name: true } },
  receiver: { select: { id: true, name: true } },
} satisfies Prisma.CallInclude;

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, delete: false },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new BadRequestException('invalid-receiver');
    }

    return user;
  }

  async create(callerId: string, dto: CreateCallDto) {
    const receiver = await this.findUser(dto.receiver_id);

    if (dto.to_return === false) {
      await this.prisma.call.updateMany({
        where: { receiver_id: receiver.id },
        data: { to_return: false },
      });
    }

    return this.prisma.call.create({
      data: {
        caller_id: callerId,
        receiver_id: receiver.id,
        description: dto.description,
        to_return: dto.to_return ?? false,
      },
      include: callInclude,
    });
  }

  async findAll() {
    return this.prisma.call.findMany({
      include: callInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.call.findMany({
      where: { caller_id: userId },
      include: callInclude,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const call = await this.prisma.call.findUnique({
      where: { id },
      include: callInclude,
    });

    if (!call) {
      throw new NotFoundException('call-not-found');
    }

    return call;
  }

  async update(id: string, dto: UpdateCallDto) {
    const current = await this.findOne(id);
    const receiverId = dto.receiver_id ?? current.receiver_id;

    if (dto.receiver_id) {
      await this.findUser(dto.receiver_id);
    }

    if (dto.to_return === false && receiverId) {
      await this.prisma.call.updateMany({
        where: { receiver_id: receiverId },
        data: { to_return: false },
      });
    }

    return this.prisma.call.update({
      where: { id },
      data: {
        ...(dto.receiver_id !== undefined ? { receiver_id: dto.receiver_id } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.to_return !== undefined ? { to_return: dto.to_return } : {}),
      },
      include: callInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.call.delete({
      where: { id },
    });
  }
}
