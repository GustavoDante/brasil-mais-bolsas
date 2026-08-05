import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MailService } from '../../integrations/mail/mail.service';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;

  const payload = {
    name: 'Joao da Silva',
    email: 'joao@email.com',
    phone: '11999999999',
    subject: 'Duvida sobre bolsa',
    message: 'Gostaria de saber mais sobre as bolsas disponiveis.',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MailService, useValue: { sendContact: jest.fn() } },
      ],
    }).compile();

    service = module.get(ContactService);
    configService = module.get(ConfigService);
    mailService = module.get(MailService);
  });

  const withEnv = (env: Record<string, string | undefined>) => {
    configService.get.mockImplementation((key: string) => env[key]);
  };

  describe('submit', () => {
    it('deve encaminhar para a caixa geral quando nao houver type', async () => {
      withEnv({ CONTACT_EMAIL_DEFAULT: 'suporte@bmb.com.br' });
      mailService.sendContact.mockResolvedValue({ sent: true, id: 'mail-1' });

      const result = await service.submit(payload);

      expect(result).toEqual({ ok: true, message: 'contact-sent' });
      expect(mailService.sendContact).toHaveBeenCalledWith(
        'suporte@bmb.com.br',
        expect.objectContaining({ email: payload.email, originLabel: undefined }),
      );
    });

    it('deve encaminhar para a caixa especifica do type informado', async () => {
      withEnv({
        CONTACT_EMAIL_DEFAULT: 'suporte@bmb.com.br',
        CONTACT_EMAIL_SOU_PARCEIRO: 'parcerias@bmb.com.br',
      });
      mailService.sendContact.mockResolvedValue({ sent: true });

      await service.submit({ ...payload, type: 'souParceiro' });

      expect(mailService.sendContact).toHaveBeenCalledWith(
        'parcerias@bmb.com.br',
        expect.objectContaining({ originLabel: 'Sou parceiro' }),
      );
    });

    it('deve cair para a caixa geral quando a especifica nao estiver configurada', async () => {
      withEnv({ CONTACT_EMAIL_DEFAULT: 'suporte@bmb.com.br' });
      mailService.sendContact.mockResolvedValue({ sent: true });

      await service.submit({ ...payload, type: 'souAluno' });

      expect(mailService.sendContact).toHaveBeenCalledWith(
        'suporte@bmb.com.br',
        expect.objectContaining({ originLabel: 'Sou aluno' }),
      );
    });

    it('deve responder 503 quando nenhuma caixa estiver configurada', async () => {
      withEnv({});

      await expect(service.submit(payload)).rejects.toMatchObject({ httpStatus: 503 });
      expect(mailService.sendContact).not.toHaveBeenCalled();
    });

    it('deve responder 503 quando o envio falhar, para nao dar falso sucesso ao usuario', async () => {
      withEnv({ CONTACT_EMAIL_DEFAULT: 'suporte@bmb.com.br' });
      mailService.sendContact.mockResolvedValue({ sent: false, reason: 'mail-provider-error' });

      await expect(service.submit(payload)).rejects.toMatchObject({ httpStatus: 503 });
    });

    it('deve ignorar caixa configurada só com espacos e usar a geral', async () => {
      withEnv({
        CONTACT_EMAIL_DEFAULT: 'suporte@bmb.com.br',
        CONTACT_EMAIL_SOU_ALUNO: '   ',
      });
      mailService.sendContact.mockResolvedValue({ sent: true });

      await service.submit({ ...payload, type: 'souAluno' });

      expect(mailService.sendContact).toHaveBeenCalledWith('suporte@bmb.com.br', expect.anything());
    });
  });
});
