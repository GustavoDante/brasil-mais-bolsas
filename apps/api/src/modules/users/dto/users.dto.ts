import {
  AdminUpdateUserSchema,
  CreateAddressSchema,
  CreateUserSchema,
  UpdateAddressSchema,
  UpdateUserSchema,
} from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateAddressDto extends createZodDto(CreateAddressSchema) {}

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export class UpdateAddressDto extends createZodDto(UpdateAddressSchema) {}

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

/** Só admin muda `type` e `active` — por isso é um schema próprio, não um campo opcional. */
export class AdminUpdateUserDto extends createZodDto(AdminUpdateUserSchema) {}
