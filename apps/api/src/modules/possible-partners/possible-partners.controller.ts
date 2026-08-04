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
import {
  CreatePossiblePartnerCallDto,
  CreatePossiblePartnerDto,
} from './dto/possible-partners.dto';
import { PossiblePartnersService } from './possible-partners.service';

@ApiTags('Possible Partners')
@Controller('possible-partners')
export class PossiblePartnersController {
  constructor(private readonly possiblePartnersService: PossiblePartnersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova oportunidade de parceria' })
  @ApiResponse({ status: 201, description: 'Lead criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados duplicados ou inválidos' })
  async create(@Body() createDto: CreatePossiblePartnerDto) {
    const possiblePartner = await this.possiblePartnersService.create(createDto);
    return { ok: true, message: 'possible-partner-created', possiblePartner };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista leads de parceria (Apenas Admin)' })
  async findAll(@Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    const possiblePartners = await this.possiblePartnersService.findAll();
    return { ok: true, possiblePartners };
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um lead de parceria por id (Apenas Admin)' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    const possiblePartner = await this.possiblePartnersService.findOne(id);
    return { ok: true, possiblePartner };
  }

  @Post('call')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registra uma chamada de lead de parceria (Admin ou Manager)' })
  async createCall(@Body() dto: CreatePossiblePartnerCallDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin' && req.user.type !== 'manager') {
      throw new ForbiddenException('unauthorized');
    }

    const call = await this.possiblePartnersService.createCall(req.user.userId, dto);
    return { ok: true, message: 'possible-partner-call-created', call };
  }

  @Delete('call/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove uma chamada de lead de parceria (Apenas Admin)' })
  async removeCall(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new ForbiddenException('unauthorized');
    }

    await this.possiblePartnersService.removeCall(id);
    return { ok: true, message: 'possible-partner-call-deleted' };
  }
}
