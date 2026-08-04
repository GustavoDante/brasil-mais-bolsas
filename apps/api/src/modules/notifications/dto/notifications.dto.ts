import { CreateNotificationSchema, UpdateNotificationSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateNotificationDto extends createZodDto(CreateNotificationSchema) {}

export class UpdateNotificationDto extends createZodDto(UpdateNotificationSchema) {}
