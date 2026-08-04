import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type { User } from '@repo/db';
import { MailService } from '../../integrations/mail/mail.service';
import type { UserSafe } from '../users/types/user-safe.type';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

const mockUser: User = {
  id: 'user-id-1',
  name: 'Joao Silva',
  email: 'joao@test.com',
  password: 'hashed_password',
  type: 'user',
  phone: '11999999999',
  secondary_phone: null,
  whatsapp_phone: null,
  friend_phone: null,
  birthdate: new Date('1990-01-01'),
  cpf: null,
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

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            toSafeUser: jest.fn(),
            register: jest.fn(),
            setPasswordResetToken: jest.fn(),
            findByValidResetToken: jest.fn(),
            updatePasswordAndClearResetToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendNewUser: jest.fn().mockResolvedValue({ sent: true }),
            sendPasswordReset: jest.fn().mockResolvedValue({ sent: true }),
            sendPasswordResetConfirm: jest.fn().mockResolvedValue({ sent: true }),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  describe('validateUser', () => {
    it('deve retornar null se o usuario nao existir', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('naoexiste@test.com', '123456');

      expect(result).toBeNull();
    });

    it('deve retornar null se o usuario nao tiver senha', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, password: null });

      const result = await service.validateUser(mockUser.email, '123456');

      expect(result).toBeNull();
    });

    it('deve retornar null se a senha estiver errada', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(mockUser.email, 'senha_errada');

      expect(result).toBeNull();
    });

    it('deve retornar UserSafe se a senha estiver correta', async () => {
      const safeUser = { ...mockUser, password: undefined };
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      usersService.toSafeUser.mockReturnValue(safeUser);

      const result = await service.validateUser(mockUser.email, '123456');

      expect(result).toEqual(safeUser);
      expect(usersService.toSafeUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('login', () => {
    it('deve retornar accessToken e dados do usuario', async () => {
      const safeUser = { ...mockUser } as UserSafe;
      jwtService.signAsync.mockResolvedValue('jwt.token.aqui');

      const result = await service.login(safeUser);

      expect(result.accessToken).toBe('jwt.token.aqui');
      expect(result.user).toEqual(safeUser);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: safeUser.id,
        email: safeUser.email,
        type: safeUser.type,
      });
    });
  });

  describe('register', () => {
    const registerDto = {
      name: 'Joao Silva',
      email: 'Joao@Test.com',
      phone: '11999999999',
      birthdate: '1990-01-01',
      cpf: '12345678901',
      rg: '1234567',
      rg_emissor: 'SSP-SP',
      address: {
        street: 'Rua A',
        city: 'Sao Paulo',
        state: 'SP',
        number: '10',
        district: 'Centro',
        postal_code: '01000-000',
      },
    };

    it('deve criar o usuario, enviar boas-vindas e devolver o token', async () => {
      usersService.register.mockResolvedValue({ ...mockUser, address: null });
      usersService.toSafeUser.mockReturnValue({ ...mockUser });
      jwtService.signAsync.mockResolvedValue('jwt.token.aqui');

      const result = await service.register(registerDto);

      expect(usersService.register).toHaveBeenCalledWith(registerDto);
      expect(mailService.sendNewUser).toHaveBeenCalledWith(mockUser.email, {
        name: mockUser.name,
      });
      expect(result.accessToken).toBe('jwt.token.aqui');
    });

    it('nao deve engolir erro de cadastro (ex: email duplicado)', async () => {
      usersService.register.mockRejectedValue(new Error('Email já está em uso'));

      await expect(service.register(registerDto)).rejects.toThrow('Email já está em uso');
      expect(mailService.sendNewUser).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('deve gravar o hash do token e enviar o e-mail', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await service.forgotPassword('JOAO@test.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith('joao@test.com');

      const [userId, tokenHash, expiresAt] = usersService.setPasswordResetToken.mock.calls[0];
      expect(userId).toBe(mockUser.id);
      // SHA-256 em hex — o token em si nunca vai para o banco
      expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      const [to, params] = mailService.sendPasswordReset.mock.calls[0];
      expect(to).toBe(mockUser.email);
      expect(params.token).toHaveLength(64);
      expect(params.token).not.toBe(tokenHash);
      expect(params.expiresInHours).toBe(24);
    });

    it('deve sair em silencio quando o e-mail nao existe (nao revela cadastro)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('nao@existe.com')).resolves.toBeUndefined();
      expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('deve ignorar usuario inativo ou deletado', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, active: false });

      await service.forgotPassword(mockUser.email);

      expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
    });

    it('nao deve lancar quando o envio do e-mail falha', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      mailService.sendPasswordReset.mockResolvedValue({
        sent: false,
        reason: 'mail-provider-error',
      });

      await expect(service.forgotPassword(mockUser.email)).resolves.toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('deve trocar a senha, limpar o token e avisar o usuario', async () => {
      usersService.findByValidResetToken.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('nova_hash');

      await service.resetPassword('a'.repeat(64), 'SenhaNova123', 'SenhaNova123');

      // A busca é pelo hash do token, não pelo token recebido
      expect(usersService.findByValidResetToken).toHaveBeenCalledWith(
        expect.stringMatching(/^[0-9a-f]{64}$/),
      );
      expect(usersService.findByValidResetToken).not.toHaveBeenCalledWith('a'.repeat(64));
      expect(usersService.updatePasswordAndClearResetToken).toHaveBeenCalledWith(
        mockUser.id,
        'nova_hash',
      );
      expect(mailService.sendPasswordResetConfirm).toHaveBeenCalledWith(
        mockUser.email,
        expect.objectContaining({ name: mockUser.name }),
      );
    });

    it('deve recusar quando as senhas nao conferem', async () => {
      await expect(
        service.resetPassword('a'.repeat(64), 'SenhaNova123', 'OutraSenha123'),
      ).rejects.toThrow('passwords-not-matching');
      expect(usersService.findByValidResetToken).not.toHaveBeenCalled();
    });

    it('deve recusar token inexistente ou expirado', async () => {
      usersService.findByValidResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword('a'.repeat(64), 'SenhaNova123', 'SenhaNova123'),
      ).rejects.toThrow('token-not-found-or-expired');
      expect(usersService.updatePasswordAndClearResetToken).not.toHaveBeenCalled();
    });
  });
});
