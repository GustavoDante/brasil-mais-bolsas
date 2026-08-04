import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@repo/db';

export class AddressResponseDto {
  @ApiProperty({ example: 'cuid-address-id' })
  id!: string;

  @ApiProperty({ example: 'Rua das Flores' })
  street!: string;

  @ApiProperty({ example: 'Sao Paulo' })
  city!: string;

  @ApiProperty({ example: 'SP' })
  state!: string;

  @ApiProperty({ example: '123' })
  number!: string;

  @ApiProperty({ example: 'Centro' })
  district!: string;

  @ApiProperty({ example: '01310-100' })
  postal_code!: string;

  @ApiPropertyOptional({ example: 'Apto 42' })
  complement?: string | null;
}

export class UserResponseDto {
  @ApiProperty({ example: 'cuid-user-id' })
  id!: string;

  @ApiProperty({ example: 'Joao da Silva' })
  name!: string;

  @ApiProperty({ example: 'joao@email.com' })
  email!: string;

  @ApiProperty({ example: 'user', enum: ['user', 'admin', 'manager'] })
  type!: string;

  @ApiProperty({ example: '11999999999' })
  phone!: string;

  @ApiPropertyOptional({ example: '11988888888' })
  secondary_phone?: string | null;

  @ApiPropertyOptional({ example: '11977777777' })
  whatsapp_phone?: string | null;

  @ApiPropertyOptional({ example: '11966666666' })
  friend_phone?: string | null;

  @ApiProperty({ example: '1990-01-01T00:00:00.000Z', type: String })
  birthdate!: Date;

  @ApiPropertyOptional({ example: '12345678901' })
  cpf?: string | null;

  @ApiProperty({ example: '1234567' })
  rg!: string;

  @ApiProperty({ example: 'SSP-SP' })
  rg_emissor!: string;

  @ApiPropertyOptional({ example: 2500.5, type: Number })
  family_income?: Prisma.Decimal | null;

  @ApiPropertyOptional({ example: 'CCP-123' })
  ccp?: string | null;

  @ApiPropertyOptional({ example: 'Observacoes sobre o usuario' })
  observations?: string | null;

  @ApiPropertyOptional({ example: 'cuid-partner-id' })
  partner_id?: string | null;

  @ApiPropertyOptional({ example: 'cuid-institution-id' })
  institution_id?: string | null;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ example: false })
  delete!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', type: String })
  created_at!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', type: String })
  updated_at!: Date;

  @ApiPropertyOptional({ type: () => AddressResponseDto })
  address?: AddressResponseDto | null;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  users!: UserResponseDto[];
}
