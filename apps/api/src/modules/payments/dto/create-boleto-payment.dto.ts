import { CreateBoletoPaymentSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateBoletoPaymentDto extends createZodDto(CreateBoletoPaymentSchema) {}
