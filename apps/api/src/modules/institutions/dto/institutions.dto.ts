import { CreateInstitutionSchema, UpdateInstitutionSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateInstitutionDto extends createZodDto(CreateInstitutionSchema) {}

export class UpdateInstitutionDto extends createZodDto(UpdateInstitutionSchema) {}
