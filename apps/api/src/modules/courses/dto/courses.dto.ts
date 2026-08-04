import { CreateCourseSchema, UpdateCourseSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateCourseDto extends createZodDto(CreateCourseSchema) {}

export class UpdateCourseDto extends createZodDto(UpdateCourseSchema) {}
