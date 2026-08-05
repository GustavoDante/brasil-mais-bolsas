import { Test } from '@nestjs/testing';
import type { User } from '@repo/db';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUser: User = {
  id: 'user-id-1',
  name: 'JOAO SILVA',
  email: 'joao@test.com',
  password: 'hashed',
  type: 'user',
  phone: '11999999999',
  secondary_phone: null,
  whatsapp_phone: null,
  friend_phone: null,
  birthdate: new Date('1990-01-01'),
  cpf: '12345678901',
  rg: '1234567',
  rg_emissor: 'SSP-SP',
  family_income: null,
  ccp: null,
  observations: null,
  partner_id: null,
  register_scholarship: null,
  institution_id: null,
  active: true,
  delete: false,
  reset_password_token: null,
  reset_password_expires: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockUserWithAddress = { ...mockUser, address: null };

const adminJwt = { userId: 'admin-id', email: 'admin@test.com', type: 'admin' };
const userJwt = { userId: 'user-id-1', email: 'joao@test.com', type: 'user' };

const makeReq = (user: typeof adminJwt) => ({ user }) as never;

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findByIdWithAddress: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            toggleActive: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
  });

  describe('findAll', () => {
    it('deve retornar lista de usuarios para admin', async () => {
      usersService.findAll.mockResolvedValue([mockUserWithAddress]);

      const result = await controller.findAll(makeReq(adminJwt));

      expect(result.users).toHaveLength(1);
    });

    it('deve lancar AppException 403 para nao-admin', async () => {
      await expect(controller.findAll(makeReq(userJwt))).rejects.toMatchObject({ httpStatus: 403 });
    });
  });

  describe('getMe', () => {
    it('deve retornar o perfil do usuario autenticado sem campos sensiveis', async () => {
      usersService.findByIdWithAddress.mockResolvedValue(mockUserWithAddress);

      const result = await controller.getMe(makeReq(userJwt));

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('reset_password_token');
      expect(result.id).toBe(mockUser.id);
    });

    it('deve lancar AppException 404 se o usuario nao existir', async () => {
      usersService.findByIdWithAddress.mockResolvedValue(null);

      await expect(controller.getMe(makeReq(userJwt))).rejects.toMatchObject({ httpStatus: 404 });
    });
  });

  describe('findOne', () => {
    it('deve retornar usuario para admin', async () => {
      usersService.findByIdWithAddress.mockResolvedValue(mockUserWithAddress);

      const result = await controller.findOne(mockUser.id, makeReq(adminJwt));

      expect(result.id).toBe(mockUser.id);
    });

    it('deve permitir usuario acessar seu proprio perfil', async () => {
      usersService.findByIdWithAddress.mockResolvedValue(mockUserWithAddress);

      const result = await controller.findOne(userJwt.userId, makeReq(userJwt));

      expect(result.id).toBe(mockUser.id);
    });

    it('deve lancar AppException 403 se usuario tentar acessar outro id', async () => {
      await expect(controller.findOne('outro-id', makeReq(userJwt))).rejects.toMatchObject({
        httpStatus: 403,
      });
    });
  });

  describe('create', () => {
    it('deve criar usuario para admin', async () => {
      usersService.create.mockResolvedValue(mockUserWithAddress);

      const dto = {} as never;
      const result = await controller.create(dto, makeReq(adminJwt));

      expect(result.id).toBe(mockUser.id);
      expect(usersService.create).toHaveBeenCalledWith(dto);
    });

    it('deve lancar AppException 403 para nao-admin', async () => {
      await expect(controller.create({} as never, makeReq(userJwt))).rejects.toMatchObject({
        httpStatus: 403,
      });
    });
  });

  describe('toggle', () => {
    it('deve ativar/desativar usuario para admin', async () => {
      usersService.toggleActive.mockResolvedValue({ ...mockUser, active: false });

      const result = await controller.toggle(mockUser.id, makeReq(adminJwt));

      expect(result.active).toBe(false);
    });

    it('deve lancar AppException 403 para nao-admin', async () => {
      await expect(controller.toggle(mockUser.id, makeReq(userJwt))).rejects.toMatchObject({
        httpStatus: 403,
      });
    });
  });

  describe('remove', () => {
    it('deve realizar soft delete para admin', async () => {
      usersService.softDelete.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser.id, makeReq(adminJwt));

      expect(result.message).toBe('Usuário removido com sucesso');
      expect(usersService.softDelete).toHaveBeenCalledWith(mockUser.id);
    });

    it('deve lancar AppException 403 para nao-admin', async () => {
      await expect(controller.remove(mockUser.id, makeReq(userJwt))).rejects.toMatchObject({
        httpStatus: 403,
      });
    });
  });
});
