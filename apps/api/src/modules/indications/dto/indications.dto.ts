import {
  CreateIndicationCallSchema,
  CreateIndicationSchema,
  UpdateIndicationSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateIndicationDto extends createZodDto(CreateIndicationSchema) {}

export class UpdateIndicationDto extends createZodDto(UpdateIndicationSchema) {}

export class CreateIndicationCallDto extends createZodDto(CreateIndicationCallSchema) {}
