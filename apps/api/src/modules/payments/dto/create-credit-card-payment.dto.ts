import { CreateCreditCardPaymentSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

/**
 * Os dados do cartao trafegam mas nunca sao persistidos — vao direto para o gateway.
 * Nenhum campo daqui pode aparecer num schema de resposta.
 */
export class CreateCreditCardPaymentDto extends createZodDto(CreateCreditCardPaymentSchema) {}
