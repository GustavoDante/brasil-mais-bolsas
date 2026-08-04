import { Test } from '@nestjs/testing';
import { PossiblePartnersController } from './possible-partners.controller';
import { PossiblePartnersService } from './possible-partners.service';

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const managerJwt = { userId: 'manager-id', email: 'manager@test.com', type: 'manager' };

const makeReq = (user: typeof adminJwt) => ({ user }) as never;

describe('PossiblePartnersController', () => {
  let controller: PossiblePartnersController;
  let service: jest.Mocked<PossiblePartnersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PossiblePartnersController],
      providers: [
        {
          provide: PossiblePartnersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            createCall: jest.fn(),
            removeCall: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PossiblePartnersController);
    service = module.get(PossiblePartnersService);
  });

  describe('create', () => {
    it('deve criar lead publicamente', async () => {
      service.create.mockResolvedValue({ id: 'pp-1' } as never);

      const result = await controller.create({
        name: 'Lead',
        email: 'lead@test.com',
        cell: '11999999999',
      });

      expect(result.ok).toBe(true);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar leads para admin', async () => {
      service.findAll.mockResolvedValue([{ id: 'pp-1' } as never]);

      const result = await controller.findAll(makeReq(adminJwt));

      expect(result.possiblePartners).toHaveLength(1);
    });

    it('deve bloquear não-admin', async () => {
      await expect(controller.findAll(makeReq(managerJwt))).rejects.toMatchObject({ httpStatus: 403 });
    });
  });

  describe('findOne', () => {
    it('deve retornar lead para admin', async () => {
      service.findOne.mockResolvedValue({ id: 'pp-1' } as never);

      const result = await controller.findOne('pp-1', makeReq(adminJwt));

      expect(result.possiblePartner).toEqual({ id: 'pp-1' });
    });
  });

  describe('createCall', () => {
    it('deve criar chamada para admin', async () => {
      service.createCall.mockResolvedValue({ id: 'call-1' } as never);

      const result = await controller.createCall(
        {
          possible_partner_id: 'pp-1',
          description: 'Contato realizado',
        },
        makeReq(adminJwt),
      );

      expect(result.message).toBe('possible-partner-call-created');
    });
  });

  describe('removeCall', () => {
    it('deve remover chamada para admin', async () => {
      service.removeCall.mockResolvedValue({ id: 'call-1' } as never);

      const result = await controller.removeCall('call-1', makeReq(adminJwt));

      expect(result.message).toBe('possible-partner-call-deleted');
    });
  });
});
