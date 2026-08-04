import { CreateInterestPaymentSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateInterestPaymentDto extends createZodDto(CreateInterestPaymentSchema) {}
