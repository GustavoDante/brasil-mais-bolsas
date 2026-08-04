import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessService } from './access.service';
import { CreateAccessDto } from './dto/access.dto';

@ApiTags('Access')
@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar novo acesso (parceiro)' })
  async create(@Body() dto: CreateAccessDto) {
    const access = await this.accessService.create(dto);
    return { ok: true, access };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar acessos' })
  async findAll() {
    const accesses = await this.accessService.findAll();
    return { ok: true, accesses };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover acesso' })
  async remove(@Param('id') id: string) {
    await this.accessService.remove(id);
    return { ok: true };
  }
}
