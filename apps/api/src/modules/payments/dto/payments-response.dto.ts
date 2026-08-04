import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Payment } from '@repo/db';

class PaymentGatewayDto {
  @ApiProperty({ example: 'pay_987654321' })
  id!: string;

  @ApiProperty({ example: 'PENDING' })
  status!: string;

  @ApiPropertyOptional({ example: 'https://asaas.com/i/123' })
  invoiceUrl?: string;

  @ApiPropertyOptional()
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
  };
}

class PixQrCodeDto {
  @ApiProperty({ description: 'Imagem do QR Code em Base64' })
  encodedImage!: string;

  @ApiProperty({ description: 'Código Copia e Cola do PIX' })
  payload!: string;

  @ApiProperty({ description: 'Data de expiração do QR Code' })
  expirationDate!: string;
}

export class PixPaymentResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'pix-payment-created' })
  message!: string;

  @ApiProperty({ description: 'Dados do pagamento registrado no banco' })
  payment!: Payment;

  @ApiProperty({ type: PaymentGatewayDto })
  gateway!: PaymentGatewayDto;

  @ApiProperty({ type: PixQrCodeDto })
  pixQrCode!: PixQrCodeDto;
}

export class InterestPaymentResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'interest-payment-created-successfully' })
  message!: string;

  @ApiProperty({ example: 'cuid-payment-id' })
  paymentId!: string;

  @ApiProperty({ description: 'Dados do pagamento registrado no banco' })
  payment!: Payment;

  @ApiProperty({ type: PaymentGatewayDto })
  gateway!: PaymentGatewayDto;

  @ApiProperty({ type: PixQrCodeDto })
  pixQrCode!: PixQrCodeDto;
}

export class CreditCardPaymentResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'payment-created' })
  message!: string;

  @ApiProperty({ description: 'Dados do pagamento registrado no banco' })
  payment!: Payment;

  @ApiProperty({ type: PaymentGatewayDto })
  gateway!: PaymentGatewayDto;
}

export class AsaasWebhookResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'asaas-webhook-processed' })
  message!: string;

  @ApiPropertyOptional({ example: 'PAYMENT_CONFIRMED' })
  event?: string;

  @ApiProperty({ example: 'pay_123456789' })
  gatewayPaymentId!: string;
}
