import { ApiProperty } from '@nestjs/swagger';
import type { Prisma } from '@repo/db';

export class UserSafeDto {
  @ApiProperty({ example: 'cku1f7b2a0001m5sdf5a4b1c2' })
  id!: string;

  @ApiProperty({ example: 'Joao da Silva' })
  name!: string;

  @ApiProperty({ example: 'user@email.com' })
  email!: string;

  @ApiProperty({ example: 'user' })
  type!: string;

  @ApiProperty({ example: '11999999999' })
  phone!: string;

  @ApiProperty({ required: false, example: '11988888888' })
  secondary_phone?: string | null;

  @ApiProperty({ required: false, example: '11977777777' })
  whatsapp_phone?: string | null;

  @ApiProperty({ required: false, example: '11966666666' })
  friend_phone?: string | null;

  @ApiProperty({ example: '1990-01-01T00:00:00.000Z', type: String })
  birthdate!: Date;

  @ApiProperty({ required: false, example: '12345678900' })
  cpf?: string | null;

  @ApiProperty({ example: '1234567' })
  rg!: string;

  @ApiProperty({ example: 'SSP-SP' })
  rg_emissor!: string;

  @ApiProperty({ required: false, example: 2500.5, type: Number })
  family_income?: Prisma.Decimal | null;

  @ApiProperty({ required: false, example: 'CCP-123' })
  ccp?: string | null;

  @ApiProperty({ required: false })
  observations?: string | null;

  @ApiProperty({ required: false })
  partner_id?: string | null;

  @ApiProperty({ required: false })
  register_scholarship?: string | null;

  @ApiProperty({ required: false })
  institution_id?: string | null;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ example: false })
  delete!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', type: String })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', type: String })
  updated_at!: Date;
}
