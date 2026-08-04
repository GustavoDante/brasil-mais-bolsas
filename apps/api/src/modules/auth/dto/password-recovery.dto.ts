import { ApiProperty } from '@nestjs/swagger';
import { ForgotPasswordSchema, ResetPasswordSchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

/**
 * O schema já compara `password` e `repassword` (`.refine`), então a divergência vira 400
 * antes de chegar no service — e a mesma regra vale no formulário do web.
 */
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}

export class ForgotPasswordResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({
    example: 'password-reset-requested',
    description:
      'Resposta genérica: é a mesma para e-mail existente ou não, para não revelar quem tem cadastro',
  })
  message!: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'password-updated' })
  message!: string;
}
