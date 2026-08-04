import { Test } from '@nestjs/testing';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

const adminJwt = { userId: 'admin-1', email: 'admin@test.com', type: 'admin' };
const managerJwt = { userId: 'manager-1', email: 'manager@test.com', type: 'manager' };

const makeReq = (user: typeof adminJwt | typeof managerJwt) => ({ user }) as never;

describe('CallsController', () => {
  let controller: CallsController;
  let service: jest.Mocked<CallsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CallsController],
      providers: [
        {
          provide: CallsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByUser: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(CallsController);
    service = module.get(CallsService);
  });

  it('deve criar chamado para admin', async () => {
    service.create.mockResolvedValue({ id: 'call-1' } as never);

    const result = await controller.create(
      { receiver_id: 'user-1', description: 'Descrição' },
      makeReq(adminJwt),
    );

    expect(result.message).toBe('call-created');
  });

  it('deve bloquear criação para não-admin', async () => {
    await expect(
      controller.create({ receiver_id: 'user-1', description: 'Descrição' }, makeReq(managerJwt)),
    ).rejects.toMatchObject({ httpStatus: 403 });
  });
});
