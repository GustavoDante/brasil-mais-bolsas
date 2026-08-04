import { ApiProperty } from '@nestjs/swagger';
import { UserSafeDto } from './user-safe.dto';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ type: UserSafeDto })
  user!: UserSafeDto;
}
