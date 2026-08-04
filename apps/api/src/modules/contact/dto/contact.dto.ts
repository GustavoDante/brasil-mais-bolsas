import { ApiProperty } from '@nestjs/swagger';
import { ContactRequestSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

/**
 * O schema **nao** tem `targetEmail`. O destino sai de `type` pela configuracao do
 * servidor (ver `ContactService`): aceitar o destinatario do cliente transformaria esta
 * rota publica em relay aberto de e-mail.
 */
export class ContactRequestDto extends createZodDto(ContactRequestSchema) {}

export class ContactResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'contact-sent' })
  message!: string;
}
