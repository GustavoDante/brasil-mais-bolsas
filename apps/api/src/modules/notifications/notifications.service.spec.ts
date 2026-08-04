import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    user: Record<string, jest.Mock>;
    notification: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn() },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('deve criar notificação quando usuário existir', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prisma.notification.create.mockResolvedValue({ id: 'notification-1' });

    const result = await service.create({
      title: 'Título',
      message: 'Mensagem',
      user_id: 'user-1',
    });

    expect(result).toEqual({ id: 'notification-1' });
  });

  it('deve rejeitar criação para usuário inexistente', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.create({ title: 'Título', message: 'Mensagem', user_id: 'user-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve bloquear remoção de notificação de outro usuário', async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: 'notification-1', user_id: 'user-2' });

    await expect(service.remove('notification-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('deve lançar erro ao buscar notificação inexistente', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    await expect(service.findOne('notification-1')).rejects.toThrow(NotFoundException);
  });
});
