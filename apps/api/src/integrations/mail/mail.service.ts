import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import { createElement, type ReactElement } from 'react';
import { Resend } from 'resend';
import {
  ContactEmail,
  contactSubject,
  type ContactEmailProps,
} from '../../templates/mail/contact.email';
import {
  NewUserEmail,
  newUserSubject,
  type NewUserEmailProps,
} from '../../templates/mail/new-user.email';
import {
  PasswordResetConfirmEmail,
  passwordResetConfirmSubject,
  type PasswordResetConfirmEmailProps,
} from '../../templates/mail/password-reset-confirm.email';
import {
  PasswordResetEmail,
  passwordResetSubject,
  type PasswordResetEmailProps,
} from '../../templates/mail/password-reset.email';
import {
  PaymentConfirmedEmail,
  paymentConfirmedSubject,
  type PaymentConfirmedEmailProps,
} from '../../templates/mail/payment-confirmed.email';
import type { SendMailResult } from './types/mail.types';

const DEFAULT_WEB_URL = 'https://brasilmaisbolsas.com.br';
const DEFAULT_FROM = 'Brasil Mais Bolsas <suporte@brasilmaisbolsas.com.br>';

/**
 * Envio de e-mails transacionais via **Resend**, com os templates escritos em
 * **React Email** (`src/templates/mail`).
 *
 * Substitui o `services/mail.js` do projeto antigo (nodemailer + SMTP do Gmail +
 * Handlebars). Diferenças importantes:
 *
 * - `send*` **nunca lança**. E-mail é efeito colateral: falhar ao avisar o usuário não pode
 *   derrubar um cadastro, uma troca de senha ou o webhook de pagamento. O resultado volta em
 *   `SendMailResult` e o erro vai para o log.
 * - Sem `RESEND_API_KEY` (ou com `MAIL_ENABLED=false`) o serviço vira no-op registrado no log,
 *   o que mantém ambientes de desenvolvimento funcionando sem credencial.
 * - Todo e-mail sai com versão HTML **e** texto puro, gerados do mesmo componente.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: Resend | null = null;

  constructor(private readonly configService: ConfigService) {}

  /** Boas-vindas do cadastro público de aluno. */
  sendNewUser(to: string, params: { name: string }): Promise<SendMailResult> {
    const props: NewUserEmailProps = {
      name: params.name,
      loginUrl: this.loginUrl,
      siteUrl: this.webUrl,
    };

    return this.send(to, newUserSubject, createElement(NewUserEmail, props));
  }

  /** Link de redefinição de senha (o token entra na query string). */
  sendPasswordReset(
    to: string,
    params: { name: string; token: string; expiresInHours: number },
  ): Promise<SendMailResult> {
    const props: PasswordResetEmailProps = {
      name: params.name,
      resetUrl: this.passwordResetUrl(params.token),
      expiresInHours: params.expiresInHours,
      siteUrl: this.webUrl,
    };

    return this.send(to, passwordResetSubject, createElement(PasswordResetEmail, props));
  }

  /** Aviso de que a senha foi trocada — é o que denuncia um acesso indevido. */
  sendPasswordResetConfirm(
    to: string,
    params: { name: string; changedAt: Date },
  ): Promise<SendMailResult> {
    const props: PasswordResetConfirmEmailProps = {
      name: params.name,
      loginUrl: this.loginUrl,
      siteUrl: this.webUrl,
      changedAt: this.formatDateTime(params.changedAt),
    };

    return this.send(
      to,
      passwordResetConfirmSubject,
      createElement(PasswordResetConfirmEmail, props),
    );
  }

  /** Confirmação de pagamento — dispara na baixa do webhook do Asaas. */
  sendPaymentConfirmed(
    to: string,
    params: { name: string; amount?: number | null; scholarshipDescription?: string | null },
  ): Promise<SendMailResult> {
    const props: PaymentConfirmedEmailProps = {
      name: params.name,
      amount: params.amount != null ? this.formatCurrency(params.amount) : undefined,
      scholarshipDescription: params.scholarshipDescription ?? undefined,
      portalUrl: this.studentPortalUrl,
      siteUrl: this.webUrl,
    };

    return this.send(to, paymentConfirmedSubject, createElement(PaymentConfirmedEmail, props));
  }

  /**
   * Contato do site encaminhado para a caixa do suporte.
   *
   * O `replyTo` é o e-mail de quem escreveu (e não o `MAIL_REPLY_TO` padrão): o atendente
   * responde a mensagem e a resposta vai direto para a pessoa, sem copiar endereço à mão.
   */
  sendContact(
    to: string,
    params: {
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
      originLabel?: string;
    },
  ): Promise<SendMailResult> {
    const props: ContactEmailProps = {
      name: params.name,
      email: params.email,
      phone: params.phone,
      subject: params.subject,
      message: params.message,
      originLabel: params.originLabel,
      siteUrl: this.webUrl,
    };

    return this.send(to, `${contactSubject}: ${params.subject}`, createElement(ContactEmail, props), {
      replyTo: params.email,
    });
  }

  private async send(
    to: string,
    subject: string,
    element: ReactElement,
    options: { replyTo?: string } = {},
  ): Promise<SendMailResult> {
    const client = this.getClient();

    if (!client) {
      this.logger.warn(`E-mail "${subject}" não enviado para ${to}: mail-not-configured`);
      return { sent: false, reason: 'mail-not-configured' };
    }

    try {
      const [html, text] = await Promise.all([
        render(element),
        render(element, { plainText: true }),
      ]);

      const replyTo = options.replyTo ?? this.configService.get<string>('MAIL_REPLY_TO');

      const { data, error } = await client.emails.send({
        from: this.configService.get<string>('MAIL_FROM') ?? DEFAULT_FROM,
        to,
        subject,
        html,
        text,
        ...(replyTo ? { replyTo } : {}),
      });

      if (error) {
        this.logger.error(`Falha ao enviar "${subject}" para ${to}: ${error.message}`);
        return { sent: false, reason: 'mail-provider-error' };
      }

      return { sent: true, id: data?.id };
    } catch (error) {
      this.logger.error(
        `Erro inesperado ao enviar "${subject}" para ${to}`,
        error instanceof Error ? error.stack : String(error),
      );
      return { sent: false, reason: 'mail-unexpected-error' };
    }
  }

  private getClient(): Resend | null {
    if (this.configService.get<string>('MAIL_ENABLED') === 'false') return null;

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) return null;

    this.client ??= new Resend(apiKey);

    return this.client;
  }

  private get webUrl(): string {
    return (this.configService.get<string>('APP_WEB_URL') ?? DEFAULT_WEB_URL).replace(/\/+$/, '');
  }

  private get loginUrl(): string {
    return this.buildUrl(this.configService.get<string>('MAIL_LOGIN_PATH') ?? '/login');
  }

  private get studentPortalUrl(): string {
    return this.buildUrl(
      this.configService.get<string>('MAIL_STUDENT_PORTAL_PATH') ?? '/portal-do-aluno',
    );
  }

  private passwordResetUrl(token: string): string {
    const path = this.configService.get<string>('MAIL_PASSWORD_RESET_PATH') ?? '/resetar_senha';

    return `${this.buildUrl(path)}?token=${encodeURIComponent(token)}`;
  }

  private buildUrl(path: string): string {
    return `${this.webUrl}/${path.replace(/^\/+/, '')}`;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: this.configService.get<string>('JOBS_TIMEZONE') ?? 'America/Sao_Paulo',
    }).format(date);
  }
}
