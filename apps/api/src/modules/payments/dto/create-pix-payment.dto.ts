import { CreatePixPaymentSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreatePixPaymentDto extends createZodDto(CreatePixPaymentSchema) {}
