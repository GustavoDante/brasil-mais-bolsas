import { CreateAddressStandaloneSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

/** Endereço avulso, com `user_id` explícito (o do cadastro vai dentro de `CreateUserDto`). */
export class CreateAddressDto extends createZodDto(CreateAddressStandaloneSchema) {}
