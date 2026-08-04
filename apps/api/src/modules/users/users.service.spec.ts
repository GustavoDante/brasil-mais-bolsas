import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { User } from '@repo/db';
import { UsersService } from './users.service';
import { AppException } from '../../common/exceptions/app.exception';

jest.mock('bcrypt');

const mockUser: User = {
  id: 'user-id-1',
  name: 'JOAO SILVA',
  email: 'joao@test.com',
  password: 'hashed_password',
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

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: Record<string, jest.Mock>;
    partner: Record<string, jest.Mock>;
    notification: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      partner: { findFirst: jest.fn() },
      notification: { createMany: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findByEmail', () => {
    it('deve retornar o usuario quando o email existir', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: mockUser.email } });
    });

    it('deve retornar null quando o email nao existir', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('naoexiste@test.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('deve retornar o usuario quando o id existir', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(mockUser);
    });

    it('deve retornar null quando o id nao existir', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('id-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('toSafeUser', () => {
    it('deve omitir password, reset_password_token e reset_password_expires', () => {
      const safe = service.toSafeUser(mockUser);

      expect(safe).not.toHaveProperty('password');
      expect(safe).not.toHaveProperty('reset_password_token');
      expect(safe).not.toHaveProperty('reset_password_expires');
    });

    it('deve preservar os demais campos do usuario', () => {
      const safe = service.toSafeUser(mockUser);

      expect(safe.id).toBe(mockUser.id);
      expect(safe.email).toBe(mockUser.email);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Joao Silva',
      email: 'joao@test.com',
      phone: '11999999999',
      birthdate: '1990-01-01',
      cpf: '12345678901',
      rg: '1234567',
      rg_emissor: 'SSP-SP',
      address: {
        street: 'Rua das Flores',
        city: 'São Paulo',
        state: 'SP',
        number: '123',
        district: 'Centro',
        postal_code: '01310-100',
      },
    };

    it('deve lancar AppException 409 se o email ja existir', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toMatchObject({ httpStatus: 409 });
    });

    it('deve criar o usuario com senha hasheada do CPF', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_cpf');
      prisma.user.create.mockResolvedValue({ ...mockUser, address: null });

      await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('12345678901', 10);
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  describe('toggleActive', () => {
    it('deve lancar AppException 404 se o usuario nao existir', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.toggleActive('inexistente')).rejects.toMatchObject({ httpStatus: 404 });
    });

    it('deve inverter o campo active do usuario', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, active: false });

      const result = await service.toggleActive(mockUser.id);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { active: false } }),
      );
      expect(result.active).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('deve lancar AppException 404 se o usuario nao existir', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.softDelete('inexistente')).rejects.toMatchObject({ httpStatus: 404 });
    });

    it('deve setar delete=true e active=false', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, delete: true, active: false });

      await service.softDelete(mockUser.id);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { delete: true, active: false } }),
      );
    });
  });

  describe('register', () => {
    const registerDto = {
      name: 'Joao Silva',
      email: 'Joao@Test.com',
      phone: '11999999999',
      birthdate: '1990-01-01',
      cpf: '123.456.789-01',
      rg: '1234567',
      rg_emissor: 'SSP-SP',
      address: {
        street: 'Rua A',
        city: 'Sao Paulo',
        state: 'sp',
        number: '10',
        district: 'Centro',
        postal_code: '01000-000',
      },
    };

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.create.mockResolvedValue({ ...mockUser, address: null });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash_do_cpf');
    });

    it('deve normalizar os dados e usar o CPF (so numeros) como senha inicial', async () => {
      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('12345678901', 10);

      const data = prisma.user.create.mock.calls[0][0] as {
        data: { name: string; email: string; type: string; address: { create: { state: string } } };
      };
      expect(data.data.name).toBe('JOAO SILVA');
      expect(data.data.email).toBe('joao@test.com');
      expect(data.data.address.create.state).toBe('SP');
    });

    it('deve forcar type=user (rota publica nao cria admin)', async () => {
      await service.register({ ...registerDto, type: 'admin' } as never);

      const data = prisma.user.create.mock.calls[0][0] as { data: { type: string } };
      expect(data.data.type).toBe('user');
    });

    it('deve recusar email ja cadastrado', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toMatchObject({ httpStatus: 409 });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('deve recusar CPF ja cadastrado', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toMatchObject({ httpStatus: 409 });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('deve vincular o parceiro quando o codigo existir', async () => {
      prisma.partner.findFirst.mockResolvedValue({ id: 'partner-1' });

      await service.register({ ...registerDto, partner_code: 'PARC123' });

      const data = prisma.user.create.mock.calls[0][0] as { data: { partner_id?: string } };
      expect(data.data.partner_id).toBe('partner-1');
    });

    it('deve ignorar codigo de parceiro invalido em vez de falhar', async () => {
      prisma.partner.findFirst.mockResolvedValue(null);

      await service.register({ ...registerDto, partner_code: 'NAO-EXISTE' });

      const data = prisma.user.create.mock.calls[0][0] as { data: { partner_id?: string } };
      expect(data.data.partner_id).toBeUndefined();
    });

    it('deve notificar os admins sobre o novo cadastro', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'admin-1', name: 'Admin Um' },
        { id: 'admin-2', name: 'Admin Dois' },
      ]);

      await service.register(registerDto);

      const call = prisma.notification.createMany.mock.calls[0][0] as {
        data: { user_id: string; title: string }[];
      };
      expect(call.data).toHaveLength(2);
      expect(call.data[0].title).toBe('Novo usuário cadastrado');
    });

    it('nao deve chamar createMany quando nao houver admin', async () => {
      await service.register(registerDto);

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('recuperacao de senha', () => {
    it('deve gravar hash do token e validade', async () => {
      const expiresAt = new Date('2026-08-01T00:00:00.000Z');
      prisma.user.update.mockResolvedValue(mockUser);

      await service.setPasswordResetToken(mockUser.id, 'hash-do-token', expiresAt);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { reset_password_token: 'hash-do-token', reset_password_expires: expiresAt },
      });
    });

    it('deve buscar apenas token nao expirado de conta ativa', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await service.findByValidResetToken('hash-do-token');

      const where = (prisma.user.findFirst.mock.calls[0][0] as { where: Record<string, unknown> })
        .where;
      expect(where.reset_password_token).toBe('hash-do-token');
      expect(where.delete).toBe(false);
      expect(where.active).toBe(true);
      expect(where.reset_password_expires).toEqual({ gt: expect.any(Date) });
    });

    it('deve limpar o token ao trocar a senha (link de uso unico)', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await service.updatePasswordAndClearResetToken(mockUser.id, 'nova_hash');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          password: 'nova_hash',
          reset_password_token: null,
          reset_password_expires: null,
        },
      });
    });
  });
});
