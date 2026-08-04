import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCallDto, UpdateCallDto } from './dto/calls.dto';
import { CallsService } from './calls.service';

@ApiTags('Calls')
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um chamado interno (Apenas Admin)' })
  @ApiResponse({ status: 201, description: 'Chamado criado com sucesso' })
  async create(@Body() dto: CreateCallDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    const call = await this.callsService.create(req.user.userId, dto);
    return { ok: true, message: 'call-created', call };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista chamados internos (Apenas Admin)' })
  async findAll(@Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    const calls = await this.callsService.findAll();
    return { ok: true, calls };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista chamados criados pelo usuário logado' })
  async findByUser(@Req() req: AuthenticatedRequest) {
    const calls = await this.callsService.findByUser(req.user.userId);
    return { ok: true, calls };
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um chamado por id (Apenas Admin)' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    const call = await this.callsService.findOne(id);
    return { ok: true, call };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza um chamado interno (Apenas Admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCallDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    const call = await this.callsService.update(id, dto);
    return { ok: true, message: 'call-updated', call };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove um chamado interno (Apenas Admin)' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    await this.callsService.remove(id);
    return { ok: true, message: 'call-deleted' };
  }
}
