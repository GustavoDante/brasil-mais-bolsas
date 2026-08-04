import {
  ChangeScholarshipOrderSchema,
  CreateNewScholarshipValueSchema,
  CreateScholarshipSchema,
  ScholarshipListQuerySchema,
  UpdateScholarshipSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

/**
 * Preços entram como `number` e saem como `string` nas respostas — o Prisma serializa
 * `Decimal` assim. A assimetria está declarada no contrato, não espalhada pelos handlers.
 */
export class CreateScholarshipDto extends createZodDto(CreateScholarshipSchema) {}

export class CreateNewScholarshipValueDto extends createZodDto(CreateNewScholarshipValueSchema) {}

export class UpdateScholarshipDto extends createZodDto(UpdateScholarshipSchema) {}

export class ChangeScholarshipOrderDto extends createZodDto(ChangeScholarshipOrderSchema) {}

export class ScholarshipListQueryDto extends createZodDto(ScholarshipListQuerySchema) {}
