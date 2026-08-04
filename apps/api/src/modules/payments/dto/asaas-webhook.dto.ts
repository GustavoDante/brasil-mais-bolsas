import { AsaasWebhookSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

/**
 * Unico DTO de entrada **sem** `.strict()`: o payload e de terceiro e ganha campos novos
 * sem aviso. Rejeitar por campo desconhecido derrubaria a baixa de pagamento.
 */
export class AsaasWebhookDto extends createZodDto(AsaasWebhookSchema) {}
