import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

type JwtUserFixture = {
  userId: string;
  email: string;
  type: string;
  institution_id?: string;
};

const makeReq = (user: JwtUserFixture) => ({ user }) as never;

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);
  });

  describe('getProfile', () => {
    it('deve devolver o institution_id do gestor que veio no token', () => {
      const result = controller.getProfile(
        makeReq({
          userId: 'manager-id',
          email: 'manager@test.com',
          type: 'manager',
          institution_id: 'inst-1',
        }),
      );

      expect(result).toEqual({
        userId: 'manager-id',
        email: 'manager@test.com',
        type: 'manager',
        institution_id: 'inst-1',
      });
    });

    it('deve normalizar institution_id ausente para null', () => {
      const result = controller.getProfile(
        makeReq({ userId: 'user-id', email: 'user@test.com', type: 'user' }),
      );

      // `null` explícito, e não a chave ausente: é o que permite ao web distinguir
      // "sem vínculo" de "API antiga que ainda não devolve o campo".
      expect(result).toEqual({
        userId: 'user-id',
        email: 'user@test.com',
        type: 'user',
        institution_id: null,
      });
    });
  });

  describe('forgotPassword', () => {
    it('deve responder o mesmo slug independentemente do e-mail existir', async () => {
      const result = await controller.forgotPassword({ email: 'qualquer@test.com' });

      expect(service.forgotPassword).toHaveBeenCalledWith('qualquer@test.com');
      expect(result).toEqual({ ok: true, message: 'password-reset-requested' });
    });
  });

  describe('resetPassword', () => {
    it('deve repassar token e senhas para o service', async () => {
      const result = await controller.resetPassword({
        token: 'a'.repeat(64),
        password: 'SenhaNova123',
        repassword: 'SenhaNova123',
      });

      expect(service.resetPassword).toHaveBeenCalledWith(
        'a'.repeat(64),
        'SenhaNova123',
        'SenhaNova123',
      );
      expect(result).toEqual({ ok: true, message: 'password-updated' });
    });
  });
});
