import { Test } from '@nestjs/testing';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const managerJwt = { userId: 'manager-id', email: 'manager@test.com', type: 'manager' };

const makeReq = (user: typeof adminJwt) => ({ user }) as never;

describe('SellersController', () => {
  let controller: SellersController;
  let service: jest.Mocked<SellersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SellersController],
      providers: [
        {
          provide: SellersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            login: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            toggleActive: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(SellersController);
    service = module.get(SellersService);
  });

  describe('create', () => {
    it('deve criar seller para admin', async () => {
      service.create.mockResolvedValue({ id: 'seller-1' } as never);

      const dto = { name: 'Seller', email: 'seller@test.com', password: '123456' } as never;
      const result = await controller.create(dto, makeReq(adminJwt));

      expect(result).toEqual({ ok: true, message: 'seller-created' });
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('deve bloquear seller para nao-admin', async () => {
      await expect(
        controller.create(
          { name: 'Seller', email: 'seller@test.com', password: '123456' },
          makeReq(managerJwt),
        ),
      ).rejects.toMatchObject({ httpStatus: 403 });
    });
  });

  describe('findAll', () => {
    it('deve listar sellers para admin', async () => {
      service.findAll.mockResolvedValue([{ id: 'seller-1' } as never]);

      const result = await controller.findAll({}, makeReq(adminJwt));

      expect(result.ok).toBe(true);
      expect(result.sellers).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('deve bloquear listagem para nao-admin', async () => {
      await expect(controller.findAll({}, makeReq(managerJwt))).rejects.toMatchObject({ httpStatus: 403 });
    });
  });

  describe('login', () => {
    it('deve autenticar seller sem precisar de guard', async () => {
      service.login.mockResolvedValue({ id: 'seller-1' } as never);

      const result = await controller.login({ email: 'seller@test.com', password: '123456' }, {});

      expect(result.ok).toBe(true);
      expect(result.seller).toEqual({ id: 'seller-1' });
      expect(service.login).toHaveBeenCalledWith(
        { email: 'seller@test.com', password: '123456' },
        {},
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar seller por admin', async () => {
      service.findOne.mockResolvedValue({ id: 'seller-1' } as never);

      const result = await controller.findOne('seller-1', makeReq(adminJwt));

      expect(result.ok).toBe(true);
      expect(result.seller).toEqual({ id: 'seller-1' });
    });

    it('deve bloquear acesso para nao-admin', async () => {
      await expect(controller.findOne('seller-1', makeReq(managerJwt))).rejects.toMatchObject({ httpStatus: 403 });
    });
  });

  describe('update', () => {
    it('deve atualizar seller para admin', async () => {
      service.update.mockResolvedValue({ id: 'seller-1' } as never);

      const result = await controller.update('seller-1', { name: 'Novo Nome' }, makeReq(adminJwt));

      expect(result).toEqual({ ok: true, message: 'seller-updated' });
      expect(service.update).toHaveBeenCalledWith('seller-1', { name: 'Novo Nome' });
    });

    it('deve bloquear update para nao-admin', async () => {
      await expect(
        controller.update('seller-1', { name: 'Novo Nome' }, makeReq(managerJwt)),
      ).rejects.toMatchObject({ httpStatus: 403 });
    });
  });

  describe('remove', () => {
    it('deve remover seller para admin', async () => {
      service.remove.mockResolvedValue({ id: 'seller-1' } as never);

      const result = await controller.remove('seller-1', makeReq(adminJwt));

      expect(result).toEqual({ ok: true, message: 'seller-deleted' });
      expect(service.remove).toHaveBeenCalledWith('seller-1');
    });

    it('deve bloquear delete para nao-admin', async () => {
      await expect(controller.remove('seller-1', makeReq(managerJwt))).rejects.toMatchObject({ httpStatus: 403 });
    });
  });

  describe('toggle', () => {
    it('deve alternar status do seller para admin', async () => {
      service.toggleActive.mockResolvedValue({ id: 'seller-1' } as never);

      const result = await controller.toggle('seller-1', makeReq(adminJwt));

      expect(result).toEqual({ ok: true, message: 'seller-toggled' });
      expect(service.toggleActive).toHaveBeenCalledWith('seller-1');
    });

    it('deve bloquear toggle para nao-admin', async () => {
      await expect(controller.toggle('seller-1', makeReq(managerJwt))).rejects.toMatchObject({ httpStatus: 403 });
    });
  });
});
