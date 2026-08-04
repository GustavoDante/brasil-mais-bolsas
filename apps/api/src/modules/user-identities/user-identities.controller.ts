import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserIdentityDto } from './dto/user-identity.dto';
import { UserIdentitiesService } from './user-identities.service';

@ApiTags('UserIdentities')
@Controller('user-identities')
export class UserIdentitiesController {
  constructor(private readonly service: UserIdentitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create user identity' })
  async create(@Body() dto: CreateUserIdentityDto) {
    const rec = await this.service.create(dto);
    return { ok: true, rec };
  }

  @Get()
  @ApiOperation({ summary: 'List user identities' })
  async findAll() {
    const items = await this.service.findAll();
    return { ok: true, items };
  }
}
