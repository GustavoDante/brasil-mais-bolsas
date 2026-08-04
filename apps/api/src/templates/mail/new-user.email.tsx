import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';
import { buttonStyle, EmailLayout, mutedParagraph, paragraph } from './components/email-layout';

export interface NewUserEmailProps {
  name: string;
  /** Página de login do site */
  loginUrl: string;
  siteUrl: string;
}

export const newUserSubject = 'Bem-vindo ao Brasil Mais Bolsas';

export function NewUserEmail({ name, loginUrl, siteUrl }: NewUserEmailProps) {
  return (
    <EmailLayout
      preview="Seu cadastro no Brasil Mais Bolsas foi criado"
      title={`Olá ${name}, seja bem-vindo!`}
      siteUrl={siteUrl}
    >
      <Text style={paragraph}>
        Seu cadastro no Brasil Mais Bolsas foi criado com sucesso. A partir de agora você pode
        buscar bolsas de estudo, acompanhar seus pedidos e emitir seu cupom pelo portal do aluno.
      </Text>
      <Section>
        <Button href={loginUrl} style={buttonStyle}>
          Acessar minha conta
        </Button>
      </Section>
      <Text style={{ ...paragraph, marginTop: '24px' }}>
        No primeiro acesso, use o seu e-mail e o seu CPF (apenas números) como senha. Recomendamos
        trocar a senha assim que entrar.
      </Text>
      <Text style={mutedParagraph}>
        Se você não fez este cadastro, entre em contato conosco respondendo este e-mail.
      </Text>
    </EmailLayout>
  );
}

export default NewUserEmail;
