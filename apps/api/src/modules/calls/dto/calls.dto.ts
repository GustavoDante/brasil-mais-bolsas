import { CreateCallSchema, UpdateCallSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateCallDto extends createZodDto(CreateCallSchema) {}

export class UpdateCallDto extends createZodDto(UpdateCallSchema) {}
