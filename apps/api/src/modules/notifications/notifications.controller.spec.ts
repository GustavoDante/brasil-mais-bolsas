import { Test } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const adminJwt = { userId: 'admin-1', email: 'admin@test.com', type: 'admin' };
const userJwt = { userId: 'user-1', email: 'user@test.com', type: 'user' };
const makeReq = (user: typeof adminJwt | typeof userJwt) => ({ user }) as never;

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            markAsRead: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(NotificationsController);
    service = module.get(NotificationsService);
  });

  it('deve criar notificação para admin', async () => {
    service.create.mockResolvedValue({ id: 'notification-1' } as never);

    const result = await controller.create(
      { title: 'Título', message: 'Mensagem', user_id: 'user-1' },
      makeReq(adminJwt),
    );

    expect(result.message).toBe('notification-created');
  });

  it('deve bloquear criação para user comum', async () => {
    await expect(
      controller.create(
        { title: 'Título', message: 'Mensagem', user_id: 'user-1' },
        makeReq(userJwt),
      ),
    ).rejects.toMatchObject({ httpStatus: 403 });
  });
});
