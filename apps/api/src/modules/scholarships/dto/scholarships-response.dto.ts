import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScholarshipType } from '@repo/db';

export class ScholarshipItemDto {
  @ApiProperty({ example: 'cuid-scholarship-id' })
  id!: string;

  @ApiProperty({ example: 'Manhã' })
  shift!: string;

  @ApiProperty({ enum: ScholarshipType, example: ScholarshipType.PRESENCIAL })
  type!: ScholarshipType;

  @ApiProperty({ example: 1000.0 })
  full_price!: number;

  @ApiProperty({ example: 50.0 })
  discount!: number;

  @ApiProperty({ example: 500.0 })
  final_price!: number;

  @ApiProperty({ example: 10 })
  quantity_offered!: number;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiPropertyOptional({ example: 'Descrição detalhada do curso' })
  course_description?: string | null;
}

export class ScholarshipResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiPropertyOptional({ example: 'scholarship-created' })
  message?: string;

  @ApiProperty({ type: ScholarshipItemDto })
  scholarship?: ScholarshipItemDto;
}

export class ScholarshipListResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: [ScholarshipItemDto] })
  scholarships!: ScholarshipItemDto[];
}

export class CityResponseDto {
  @ApiProperty({ example: 'São Paulo' })
  name!: string;
}

export class CityListResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: [CityResponseDto] })
  cities!: CityResponseDto[];
}

export class InstitutionMiniDto {
  @ApiProperty({ example: 'cuid-inst-id' })
  id!: string;

  @ApiProperty({ example: 'Universidade Teste' })
  name!: string;
}

export class InstitutionListResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: [InstitutionMiniDto] })
  institutions!: InstitutionMiniDto[];
}

export class CourseMiniDto {
  @ApiProperty({ example: 'cuid-course-id' })
  id!: string;

  @ApiProperty({ example: 'Administração' })
  name!: string;
}

export class CourseListResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ type: [CourseMiniDto] })
  courses!: CourseMiniDto[];
}
