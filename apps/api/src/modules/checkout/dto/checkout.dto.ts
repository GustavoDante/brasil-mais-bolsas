import { CheckoutSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CheckoutDto extends createZodDto(CheckoutSchema) {}
