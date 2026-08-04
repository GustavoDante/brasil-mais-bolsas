import { CreateAccessSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateAccessDto extends createZodDto(CreateAccessSchema) {}
