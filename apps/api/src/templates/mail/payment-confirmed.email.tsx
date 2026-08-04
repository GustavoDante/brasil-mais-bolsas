import { Button, Section, Text } from '@react-email/components';
import * as React from 'react';
import {
  buttonStyle,
  divider,
  EmailLayout,
  mutedParagraph,
  paragraph,
} from './components/email-layout';

export interface PaymentConfirmedEmailProps {
  name: string;
  /** Valor já formatado em reais (ex: "R$ 149,90") */
  amount?: string;
  /** Nome do curso/instituição da bolsa paga, quando disponível */
  scholarshipDescription?: string;
  /** Portal do aluno, onde o cupom é emitido */
  portalUrl: string;
  siteUrl: string;
}

export const paymentConfirmedSubject = 'Pagamento confirmado — Brasil Mais Bolsas';

export function PaymentConfirmedEmail({
  name,
  amount,
  scholarshipDescription,
  portalUrl,
  siteUrl,
}: PaymentConfirmedEmailProps) {
  return (
    <EmailLayout
      preview="Recebemos o seu pagamento"
      title={`Olá ${name}, seu pagamento foi confirmado!`}
      siteUrl={siteUrl}
    >
      <Text style={paragraph}>
        Recebemos o seu pagamento. Acesse o portal do aluno no Brasil Mais Bolsas para imprimir o
        seu cupom e apresentá-lo na instituição.
      </Text>

      {(amount || scholarshipDescription) && (
        <Section style={{ borderTop: divider.borderColor, paddingBottom: '8px' }}>
          {scholarshipDescription && (
            <Text style={{ ...paragraph, margin: '0 0 4px' }}>
              <strong>Bolsa:</strong> {scholarshipDescription}
            </Text>
          )}
          {amount && (
            <Text style={{ ...paragraph, margin: '0 0 16px' }}>
              <strong>Valor pago:</strong> {amount}
            </Text>
          )}
        </Section>
      )}

      <Section>
        <Button href={portalUrl} style={buttonStyle}>
          Emitir meu cupom
        </Button>
      </Section>
      <Text style={{ ...mutedParagraph, marginTop: '24px' }}>
        Guarde este e-mail como comprovante. Qualquer dúvida, responda esta mensagem.
      </Text>
    </EmailLayout>
  );
}

export default PaymentConfirmedEmail;
