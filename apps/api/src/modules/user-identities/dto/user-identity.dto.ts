import { CreateUserIdentitySchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateUserIdentityDto extends createZodDto(CreateUserIdentitySchema) {}
