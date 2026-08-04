import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMinorDto } from './dto/minor.dto';
import { MinorsService } from './minors.service';

@ApiTags('Minors')
@Controller('minors')
export class MinorsController {
  constructor(private readonly service: MinorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create minor' })
  async create(@Body() dto: CreateMinorDto) {
    const minor = await this.service.create(dto);
    return { ok: true, minor };
  }

  @Get()
  @ApiOperation({ summary: 'List minors' })
  async findAll() {
    const minors = await this.service.findAll();
    return { ok: true, minors };
  }
}
