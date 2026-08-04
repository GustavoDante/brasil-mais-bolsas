import { CreateSignedContractSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateSignedContractDto extends createZodDto(CreateSignedContractSchema) {}
