export interface SendMailResult {
  /** `true` quando a mensagem foi aceita pela Resend */
  sent: boolean;
  /** Id da mensagem na Resend (ausente quando o envio está desligado ou falhou) */
  id?: string;
  /** Motivo em kebab-case quando `sent` é `false` */
  reason?: string;
}
