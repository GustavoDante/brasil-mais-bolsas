import { CreateMinorSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateMinorDto extends createZodDto(CreateMinorSchema) {}
