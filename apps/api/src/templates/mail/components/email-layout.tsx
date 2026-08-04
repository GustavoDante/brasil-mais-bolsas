import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * Moldura compartilhada por todos os e-mails transacionais.
 *
 * Estilos ficam inline (objetos JS) porque a maioria dos clientes de e-mail ignora
 * `<style>` e classes — o mesmo motivo pelo qual o layout usa tabelas por baixo dos
 * componentes do react-email.
 */

const BRAND_COLOR = '#132f40';
const TEXT_COLOR = '#555555';

const main: React.CSSProperties = {
  backgroundColor: '#f4f6f8',
  fontFamily:
    "'Cabin', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, 'Helvetica Neue', sans-serif",
  padding: '24px 0',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '32px',
};

const heading: React.CSSProperties = {
  color: BRAND_COLOR,
  fontSize: '22px',
  fontWeight: 700,
  lineHeight: 1.3,
  margin: '0 0 16px',
};

const footerSection: React.CSSProperties = {
  paddingTop: '8px',
};

const footerText: React.CSSProperties = {
  color: '#8a8a8a',
  fontSize: '12px',
  lineHeight: 1.5,
  margin: '0 0 4px',
};

export const paragraph: React.CSSProperties = {
  color: TEXT_COLOR,
  fontSize: '16px',
  lineHeight: 1.5,
  margin: '0 0 16px',
};

export const buttonStyle: React.CSSProperties = {
  backgroundColor: BRAND_COLOR,
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 700,
  padding: '14px 28px',
  textDecoration: 'none',
};

export const mutedParagraph: React.CSSProperties = {
  color: '#8a8a8a',
  fontSize: '14px',
  lineHeight: 1.5,
  margin: '0 0 8px',
};

export const divider: React.CSSProperties = {
  borderColor: '#e6e9ec',
  margin: '24px 0',
};

interface EmailLayoutProps {
  /** Texto exibido na pré-visualização da caixa de entrada */
  preview: string;
  title: string;
  children: React.ReactNode;
  /** URL do site, usada no rodapé */
  siteUrl: string;
}

export function EmailLayout({ preview, title, children, siteUrl }: EmailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{title}</Heading>
          {children}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerText}>Brasil Mais Bolsas</Text>
            <Text style={footerText}>(81) 9711-2781</Text>
            <Text style={footerText}>
              <Link href={siteUrl} style={{ color: '#8a8a8a' }}>
                {siteUrl}
              </Link>
            </Text>
            <Text style={footerText}>
              Você recebeu este e-mail porque possui um cadastro no Brasil Mais Bolsas.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
