import { CreateFaqSchema, UpdateFaqSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateFaqDto extends createZodDto(CreateFaqSchema) {}

export class UpdateFaqDto extends createZodDto(UpdateFaqSchema) {}
