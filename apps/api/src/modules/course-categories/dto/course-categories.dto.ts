import { CreateCourseCategorySchema, UpdateCourseCategorySchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateCourseCategoryDto extends createZodDto(CreateCourseCategorySchema) {}

export class UpdateCourseCategoryDto extends createZodDto(UpdateCourseCategorySchema) {}
