import { CreatePossiblePartnerCallSchema, CreatePossiblePartnerSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreatePossiblePartnerDto extends createZodDto(CreatePossiblePartnerSchema) {}

export class CreatePossiblePartnerCallDto extends createZodDto(CreatePossiblePartnerCallSchema) {}
