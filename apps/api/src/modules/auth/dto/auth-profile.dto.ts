import { ApiProperty } from '@nestjs/swagger';

export class AuthProfileDto {
  @ApiProperty({ example: 'cku1f7b2a0001m5sdf5a4b1c2' })
  userId!: string;

  @ApiProperty({ example: 'user@email.com' })
  email!: string;

  @ApiProperty({ example: 'user' })
  type!: string;
}
