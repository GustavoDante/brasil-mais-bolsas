import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';
import { buttonStyle, EmailLayout, mutedParagraph, paragraph } from './components/email-layout';

export interface PasswordResetConfirmEmailProps {
  name: string;
  loginUrl: string;
  siteUrl: string;
  /** Momento em que a senha foi alterada, já formatado */
  changedAt: string;
}

export const passwordResetConfirmSubject = 'Sua senha foi alterada — Brasil Mais Bolsas';

export function PasswordResetConfirmEmail({
  name,
  loginUrl,
  siteUrl,
  changedAt,
}: PasswordResetConfirmEmailProps) {
  return (
    <EmailLayout
      preview="A senha da sua conta foi redefinida"
      title={`Olá ${name},`}
      siteUrl={siteUrl}
    >
      <Text style={paragraph}>
        A senha da sua conta no Brasil Mais Bolsas foi redefinida em {changedAt}. Faça login usando
        as suas novas credenciais.
      </Text>
      <Section>
        <Button href={loginUrl} style={buttonStyle}>
          Entrar na minha conta
        </Button>
      </Section>
      <Text style={{ ...mutedParagraph, marginTop: '24px' }}>
        Não foi você? Entre em contato com o nosso suporte imediatamente — alguém pode ter acesso ao
        seu e-mail.
      </Text>
    </EmailLayout>
  );
}

export default PasswordResetConfirmEmail;
