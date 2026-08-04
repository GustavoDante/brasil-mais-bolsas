import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notifications.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, delete: false },
      select: { id: true },
    });

    if (!user) {
      throw new AppException('invalid-user');
    }

    return user;
  }

  async create(dto: CreateNotificationDto) {
    await this.findUser(dto.user_id);

    return this.prisma.notification.create({
      data: {
        title: dto.title,
        message: dto.message,
        user_id: dto.user_id,
        read: dto.read ?? false,
      },
    });
  }

  async findAll(userId?: string, isAdmin = false) {
    return this.prisma.notification.findMany({
      where: isAdmin ? {} : { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppException('notification-not-found');
    }

    return notification;
  }

  async update(id: string, dto: UpdateNotificationDto) {
    await this.findOne(id);

    if (dto.user_id) {
      await this.findUser(dto.user_id);
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.message !== undefined ? { message: dto.message } : {}),
        ...(dto.user_id !== undefined ? { user_id: dto.user_id } : {}),
        ...(dto.read !== undefined ? { read: dto.read } : {}),
      },
    });
  }

  async markAsRead(id: string, userId: string, isAdmin = false) {
    const notification = await this.findOne(id);

    if (!isAdmin && notification.user_id !== userId) {
      throw new AppException('forbidden');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const notification = await this.findOne(id);

    if (!isAdmin && notification.user_id !== userId) {
      throw new AppException('forbidden');
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
