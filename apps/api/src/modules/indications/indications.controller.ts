import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateIndicationCallDto, CreateIndicationDto } from './dto/indications.dto';
import { IndicationsService } from './indications.service';

@ApiTags('Indications')
@Controller('indications')
export class IndicationsController {
  constructor(private readonly indicationsService: IndicationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma nova indicação' })
  @ApiResponse({ status: 201, description: 'Indicação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados duplicados ou inválidos' })
  async create(@Body() createIndicationDto: CreateIndicationDto, @Req() req: AuthenticatedRequest) {
    const indication = await this.indicationsService.create(req.user.userId, createIndicationDto);
    return { ok: true, message: 'indication-created', indication };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todas as indicações (Apenas Admin)' })
  async findAll(@Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }
    const indications = await this.indicationsService.findAll();
    return { ok: true, indications };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista as indicações do usuário logado' })
  async findByUser(@Req() req: AuthenticatedRequest) {
    const indications = await this.indicationsService.findByUser(req.user.userId);
    return { ok: true, indications };
  }

  @Post('call')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registra uma chamada de indicação (Admin ou Manager)' })
  async createCall(
    @Body() createCallDto: CreateIndicationCallDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.type !== 'admin' && req.user.type !== 'manager') {
      throw new ForbiddenException('unauthorized');
    }
    const call = await this.indicationsService.createCall(req.user.userId, createCallDto);
    return { ok: true, message: 'indication-call-created', call };
  }

  @Delete('call/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove um registro de chamada (Apenas Admin)' })
  async removeCall(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }
    await this.indicationsService.removeCall(id);
    return { ok: true, message: 'indication-call-deleted' };
  }
}
