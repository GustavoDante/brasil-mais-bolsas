import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Payment } from '@repo/db';
import type { CheckoutPaymentMethod } from '@repo/contracts';

class CheckoutPixQrCodeDto {
  @ApiProperty({ description: 'Imagem do QR Code em Base64' })
  encodedImage!: string;

  @ApiProperty({ description: 'Código copia e cola do PIX' })
  payload!: string;

  @ApiProperty({ example: '2026-08-06T23:59:59' })
  expirationDate!: string;
}

class CheckoutChargeDto {
  @ApiProperty({ example: 'PIX', enum: ['PIX', 'CREDIT_CARD', 'BOLETO'] })
  method!: CheckoutPaymentMethod;

  @ApiProperty({ example: 'PENDING', description: 'Status devolvido pelo gateway' })
  status!: string;

  @ApiPropertyOptional({ example: 'https://asaas.com/i/123' })
  invoiceUrl?: string | null;

  @ApiPropertyOptional({ type: CheckoutPixQrCodeDto })
  pixQrCode?: CheckoutPixQrCodeDto | null;

  @ApiPropertyOptional({ example: 'https://asaas.com/b/pdf/123' })
  bankSlipUrl?: string | null;

  @ApiPropertyOptional({ description: 'Linha digitável do boleto' })
  barCode?: string | null;
}

class CheckoutResultDto {
  @ApiProperty({ description: 'Pagamento registrado no banco' })
  payment!: Payment;

  @ApiProperty({ type: CheckoutChargeDto })
  charge!: CheckoutChargeDto;

  @ApiPropertyOptional({
    description: 'Token de acesso — presente apenas quando o checkout criou a conta',
  })
  accessToken?: string;
}

export class CheckoutResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'checkout-created' })
  message!: string;

  @ApiProperty({ type: CheckoutResultDto })
  checkout!: CheckoutResultDto;
}
