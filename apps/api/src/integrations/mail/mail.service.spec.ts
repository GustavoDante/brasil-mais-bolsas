import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';

jest.mock('resend', () => {
  const send = jest.fn();

  return {
    __send: send,
    Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
  };
});

interface ResendMockModule {
  __send: jest.Mock<Promise<unknown>, [Record<string, unknown>]>;
  Resend: jest.Mock;
}

const resendMock = jest.requireMock<ResendMockModule>('resend');

const sentPayload = (): Record<string, unknown> => resendMock.__send.mock.calls[0][0];

describe('MailService', () => {
  let service: MailService;
  let env: Record<string, string | undefined>;

  const build = async (overrides: Record<string, string | undefined> = {}) => {
    env = {
      RESEND_API_KEY: 're_teste',
      MAIL_FROM: 'Brasil Mais Bolsas <suporte@brasilmaisbolsas.com.br>',
      APP_WEB_URL: 'https://brasilmaisbolsas.com.br',
      ...overrides,
    };

    const module = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: { get: jest.fn((key: string) => env[key]) } },
      ],
    }).compile();

    service = module.get(MailService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    resendMock.__send.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    await build();
  });

  describe('sendNewUser', () => {
    it('deve enviar HTML e texto puro com o remetente configurado', async () => {
      const result = await service.sendNewUser('joao@test.com', { name: 'JOAO SILVA' });

      const payload = sentPayload();
      expect(result).toEqual({ sent: true, id: 'email-1' });
      expect(payload.to).toBe('joao@test.com');
      expect(payload.from).toBe('Brasil Mais Bolsas <suporte@brasilmaisbolsas.com.br>');
      expect(payload.subject).toContain('Bem-vindo');
      expect(String(payload.html)).toContain('JOAO SILVA');
      expect(String(payload.html)).toContain('<html');
      expect(String(payload.text)).toContain('JOAO SILVA');
      expect(String(payload.text)).not.toContain('<html');
    });

    it('deve apontar o botao para a URL de login do site', async () => {
      await service.sendNewUser('joao@test.com', { name: 'Joao' });

      expect(String(sentPayload().html)).toContain('https://brasilmaisbolsas.com.br/login');
    });
  });

  describe('sendPasswordReset', () => {
    it('deve montar o link com o token na query string', async () => {
      await service.sendPasswordReset('joao@test.com', {
        name: 'Joao',
        token: 'abc123',
        expiresInHours: 24,
      });

      const html = String(sentPayload().html);
      expect(html).toContain('https://brasilmaisbolsas.com.br/resetar_senha?token=abc123');
      expect(html).toContain('24');
    });

    it('deve respeitar o caminho customizado da pagina de reset', async () => {
      await build({ MAIL_PASSWORD_RESET_PATH: '/nova-senha' });

      await service.sendPasswordReset('joao@test.com', {
        name: 'Joao',
        token: 'abc123',
        expiresInHours: 12,
      });

      expect(String(sentPayload().html)).toContain(
        'https://brasilmaisbolsas.com.br/nova-senha?token=abc123',
      );
    });
  });

  describe('sendPaymentConfirmed', () => {
    it('deve formatar o valor em reais', async () => {
      await service.sendPaymentConfirmed('joao@test.com', {
        name: 'Joao',
        amount: 149.9,
        scholarshipDescription: 'Engenharia — Faculdade Exemplo',
      });

      const html = String(sentPayload().html);
      // \s normaliza o espaco nao separavel que o Intl usa entre "R$" e o numero
      const normalized = html.replace(/\s/g, ' ');
      expect(normalized).toContain('R$ 149,90');
      expect(html).toContain('Engenharia');
    });

    it('deve funcionar sem valor e sem descricao', async () => {
      const result = await service.sendPaymentConfirmed('joao@test.com', { name: 'Joao' });

      expect(result.sent).toBe(true);
      expect(String(sentPayload().html)).toContain('portal do aluno');
    });
  });

  describe('sendPasswordResetConfirm', () => {
    it('deve informar a data da alteracao', async () => {
      await service.sendPasswordResetConfirm('joao@test.com', {
        name: 'Joao',
        changedAt: new Date('2026-07-31T12:00:00.000Z'),
      });

      expect(String(sentPayload().html)).toContain('31/07/2026');
    });
  });

  describe('configuracao ausente ou falha do provedor', () => {
    it('deve virar no-op sem RESEND_API_KEY', async () => {
      await build({ RESEND_API_KEY: undefined });

      const result = await service.sendNewUser('joao@test.com', { name: 'Joao' });

      expect(result).toEqual({ sent: false, reason: 'mail-not-configured' });
      expect(resendMock.__send).not.toHaveBeenCalled();
    });

    it('deve virar no-op com MAIL_ENABLED=false', async () => {
      await build({ MAIL_ENABLED: 'false' });

      const result = await service.sendNewUser('joao@test.com', { name: 'Joao' });

      expect(result.sent).toBe(false);
      expect(resendMock.__send).not.toHaveBeenCalled();
    });

    it('nao deve lancar quando a Resend devolve erro', async () => {
      resendMock.__send.mockResolvedValue({
        data: null,
        error: { message: 'domain not verified', name: 'validation_error' },
      });

      const result = await service.sendNewUser('joao@test.com', { name: 'Joao' });

      expect(result).toEqual({ sent: false, reason: 'mail-provider-error' });
    });

    it('nao deve lancar quando a chamada explode', async () => {
      resendMock.__send.mockRejectedValue(new Error('network down'));

      const result = await service.sendNewUser('joao@test.com', { name: 'Joao' });

      expect(result).toEqual({ sent: false, reason: 'mail-unexpected-error' });
    });
  });
});
