import { Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import { divider, EmailLayout, mutedParagraph, paragraph } from './components/email-layout';

export interface ContactEmailProps {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  /** Rótulo already traduzido da origem do contato (ex.: "Sou aluno"). */
  originLabel?: string;
  siteUrl: string;
}

export const contactSubject = 'Novo contato pelo site';

const labelStyle: React.CSSProperties = {
  ...mutedParagraph,
  margin: '0 0 2px',
  textTransform: 'uppercase',
  fontSize: '11px',
  letterSpacing: '0.04em',
};

const valueStyle: React.CSSProperties = {
  ...paragraph,
  margin: '0 0 14px',
};

/** Mensagem sempre por último e em bloco próprio — é o que o atendente lê primeiro. */
const messageStyle: React.CSSProperties = {
  ...paragraph,
  whiteSpace: 'pre-wrap',
  margin: 0,
};

export function ContactEmail({
  name,
  email,
  phone,
  subject,
  message,
  originLabel,
  siteUrl,
}: ContactEmailProps) {
  return (
    <EmailLayout preview={`${name}: ${subject}`} title="Novo contato pelo site" siteUrl={siteUrl}>
      <Section>
        <Text style={labelStyle}>Nome</Text>
        <Text style={valueStyle}>{name}</Text>

        <Text style={labelStyle}>E-mail</Text>
        <Text style={valueStyle}>{email}</Text>

        <Text style={labelStyle}>Telefone</Text>
        <Text style={valueStyle}>{phone}</Text>

        {originLabel ? (
          <>
            <Text style={labelStyle}>Origem</Text>
            <Text style={valueStyle}>{originLabel}</Text>
          </>
        ) : null}

        <Text style={labelStyle}>Assunto</Text>
        <Text style={valueStyle}>{subject}</Text>
      </Section>

      <Hr style={divider} />

      <Section>
        <Text style={labelStyle}>Mensagem</Text>
        <Text style={messageStyle}>{message}</Text>
      </Section>

      <Text style={mutedParagraph}>
        Responder este e-mail envia a resposta direto para {email}.
      </Text>
    </EmailLayout>
  );
}
