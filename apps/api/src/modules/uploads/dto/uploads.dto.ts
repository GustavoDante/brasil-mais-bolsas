import { DeleteFileSchema, UploadFileSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class UploadFileDto extends createZodDto(UploadFileSchema) {}

/**
 * A key so passa no formato `pasta/ano/mes/uuid.ext`. E o que impede a rota de virar
 * ferramenta para apagar objeto arbitrario do bucket.
 */
export class DeleteFileDto extends createZodDto(DeleteFileSchema) {}
