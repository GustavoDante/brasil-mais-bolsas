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

class BoletoGatewayDto extends PaymentGatewayDto {
  @ApiPropertyOptional({
    example: 'https://asaas.com/b/pdf/123',
    description: 'Link do boleto para impressão',
  })
  bankSlipUrl?: string;

  @ApiPropertyOptional({
    example: '03399.63290 64000.000006 00125.201020 4 96150000010000',
    description: 'Linha digitável — ausente enquanto o boleto não é registrado pelo banco',
  })
  identificationField?: string;

  @ApiPropertyOptional({ example: '2026-08-09', description: 'Vencimento do boleto' })
  dueDate?: string;
}

export class BoletoPaymentResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'boleto-payment-created' })
  message!: string;

  @ApiProperty({ description: 'Dados do pagamento registrado no banco' })
  payment!: Payment;

  @ApiProperty({ type: BoletoGatewayDto })
  gateway!: BoletoGatewayDto;
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
