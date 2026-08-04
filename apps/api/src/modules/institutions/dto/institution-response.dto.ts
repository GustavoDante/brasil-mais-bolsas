import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InstitutionSellerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;
}

export class InstitutionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  image!: string;

  @ApiProperty()
  cnpj!: string;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  email_2?: string | null;

  @ApiProperty()
  phone!: string;

  @ApiPropertyOptional()
  phone_2?: string | null;

  @ApiPropertyOptional()
  phone_3?: string | null;

  @ApiProperty()
  owner_name!: string;

  @ApiPropertyOptional()
  owner_phone?: string | null;

  @ApiPropertyOptional()
  owner_secondary_phone?: string | null;

  @ApiPropertyOptional({ type: String })
  owner_birthdate?: Date | null;

  @ApiProperty()
  operator_name!: string;

  @ApiPropertyOptional()
  operator_phone?: string | null;

  @ApiPropertyOptional({ type: String })
  operator_birthdate?: Date | null;

  @ApiPropertyOptional()
  operator_2_name?: string | null;

  @ApiPropertyOptional()
  operator_2_phone?: string | null;

  @ApiPropertyOptional({ type: String })
  operator_2_birthdate?: Date | null;

  @ApiProperty()
  street!: string;

  @ApiProperty()
  number!: string;

  @ApiProperty()
  district!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty()
  postal_code!: string;

  @ApiProperty()
  students_count!: number;

  @ApiPropertyOptional()
  observations?: string | null;

  @ApiPropertyOptional()
  old_id?: string | null;

  @ApiProperty()
  fake!: boolean;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  delete!: boolean;

  @ApiProperty()
  seller_id!: string;

  @ApiProperty({ type: String })
  created_at!: Date;

  @ApiProperty({ type: String })
  updated_at!: Date;

  @ApiPropertyOptional({ type: () => InstitutionSellerResponseDto })
  seller?: InstitutionSellerResponseDto;

  @ApiPropertyOptional()
  scholarships_sold?: number;

  @ApiPropertyOptional()
  offered_scholarships?: number;
}

export class InstitutionListResponseDto {
  @ApiProperty({ type: [InstitutionResponseDto] })
  institutions!: InstitutionResponseDto[];
}
