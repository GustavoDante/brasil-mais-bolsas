import { Test } from '@nestjs/testing';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';

const adminJwt = { userId: 'admin-1', email: 'admin@test.com', type: 'admin' };
const userJwt = { userId: 'user-1', email: 'user@test.com', type: 'user' };
const makeReq = (user: typeof adminJwt | typeof userJwt) => ({ user }) as never;

describe('FaqController', () => {
  let controller: FaqController;
  let service: jest.Mocked<FaqService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [FaqController],
      providers: [
        {
          provide: FaqService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(FaqController);
    service = module.get(FaqService);
  });

  it('deve criar FAQ para admin', async () => {
    service.create.mockResolvedValue({ id: 'faq-1' } as never);

    const result = await controller.create({ question: 'Q?', answer: 'A' }, makeReq(adminJwt));

    expect(result.message).toBe('faq-created');
  });

  it('deve bloquear criação para user comum', async () => {
    await expect(
      controller.create({ question: 'Q?', answer: 'A' }, makeReq(userJwt)),
    ).rejects.toMatchObject({ httpStatus: 403 });
  });
});
