import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ContactType } from '@repo/contracts';
import { MailService } from '../../integrations/mail/mail.service';

/**
 * Para onde cada origem de contato é encaminhada, e como ela aparece no e-mail.
 *
 * O destino sai **daqui**, nunca do corpo da requisição. A rota é pública e sem
 * autenticação: aceitar um `targetEmail` do cliente a transformaria em relay aberto —
 * qualquer um mandaria e-mail para qualquer endereço saindo do domínio da plataforma.
 */
const CONTACT_ROUTING: Record<ContactType, { envKey: string; label: string }> = {
  souAluno: { envKey: 'CONTACT_EMAIL_SOU_ALUNO', label: 'Sou aluno' },
  queroSerAluno: { envKey: 'CONTACT_EMAIL_QUERO_SER_ALUNO', label: 'Quero ser aluno' },
  souParceiro: { envKey: 'CONTACT_EMAIL_SOU_PARCEIRO', label: 'Sou parceiro' },
};

export interface SubmitContactParams {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type?: ContactType;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async submit(params: SubmitContactParams): Promise<{ ok: true; message: string }> {
    const routing = params.type ? CONTACT_ROUTING[params.type] : undefined;
    const to = this.resolveDestination(routing?.envKey);

    if (!to) {
      this.logger.error('Contato nao encaminhado: nenhuma caixa de destino configurada');
      throw new ServiceUnavailableException('contact-not-configured');
    }

    const result = await this.mailService.sendContact(to, {
      name: params.name,
      email: params.email,
      phone: params.phone,
      subject: params.subject,
      message: params.message,
      originLabel: routing?.label,
    });

    // Aqui, ao contrario dos outros e-mails do sistema, a falha **precisa** aparecer: a
    // mensagem do usuario nao tem outra forma de chegar ao suporte. Responder 200 faria a
    // pessoa acreditar que foi atendida enquanto o contato se perdeu no log.
    if (!result.sent) {
      this.logger.error(
        `Contato de ${params.email} nao entregue: ${result.reason ?? 'motivo desconhecido'}`,
      );
      throw new ServiceUnavailableException('contact-not-delivered');
    }

    return { ok: true, message: 'contact-sent' };
  }

  /** Caixa especifica da origem, com queda para a caixa geral. */
  private resolveDestination(envKey?: string): string | undefined {
    const specific = envKey ? this.configService.get<string>(envKey)?.trim() : undefined;
    if (specific) return specific;

    return this.configService.get<string>('CONTACT_EMAIL_DEFAULT')?.trim() || undefined;
  }
}
