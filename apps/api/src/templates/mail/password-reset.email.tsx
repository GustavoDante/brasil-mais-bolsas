import { Button, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { buttonStyle, EmailLayout, mutedParagraph, paragraph } from './components/email-layout';

export interface PasswordResetEmailProps {
  name: string;
  /** Link com o token de redefinição */
  resetUrl: string;
  /** Validade do link, em horas */
  expiresInHours: number;
  siteUrl: string;
}

export const passwordResetSubject = 'Recuperação de senha — Brasil Mais Bolsas';

export function PasswordResetEmail({
  name,
  resetUrl,
  expiresInHours,
  siteUrl,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Redefina a sua senha do Brasil Mais Bolsas"
      title={`Olá ${name},`}
      siteUrl={siteUrl}
    >
      <Text style={paragraph}>
        Você solicitou a recuperação da sua senha de acesso ao Brasil Mais Bolsas. Clique no botão
        abaixo para cadastrar uma nova senha.
      </Text>
      <Section>
        <Button href={resetUrl} style={buttonStyle}>
          Redefinir minha senha
        </Button>
      </Section>
      <Text style={{ ...paragraph, marginTop: '24px' }}>
        Este link tem validade de {expiresInHours} horas e só pode ser usado uma vez.
      </Text>
      <Text style={mutedParagraph}>
        Se o botão não funcionar, copie e cole este endereço no navegador:{' '}
        <Link href={resetUrl}>{resetUrl}</Link>
      </Text>
      <Text style={mutedParagraph}>
        Se não foi você quem pediu a recuperação, ignore este e-mail — a sua senha atual continua
        valendo.
      </Text>
    </EmailLayout>
  );
}

export default PasswordResetEmail;
