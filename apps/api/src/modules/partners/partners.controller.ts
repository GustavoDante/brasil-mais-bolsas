import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreatePartnerDto,
  PartnerLoginDto,
  PartnersQueryDto,
  RegisterAccessDto,
  UpdatePartnerDto,
} from './dto/partners.dto';
import { PartnersService } from './partners.service';
import { AppException } from '../../common/exceptions/app.exception';

@ApiTags('Partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() createPartnerDto: CreatePartnerDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.partnersService.create(createPartnerDto);
    return { ok: true, message: 'partner-created' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Query() query: PartnersQueryDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    const partners = await this.partnersService.findAll(query);
    return { ok: true, partners };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: PartnerLoginDto, @Query() query: PartnersQueryDto) {
    const partner = await this.partnersService.login(loginDto, query);
    return { ok: true, partner };
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    const partner = await this.partnersService.findOne(id);
    return { ok: true, partner };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updatePartnerDto: UpdatePartnerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.partnersService.update(id, updatePartnerDto);
    return { ok: true, message: 'partner-updated' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.partnersService.remove(id);
    return { ok: true, message: 'partner-deleted' };
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async toggle(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.partnersService.toggleActive(id);
    return { ok: true, message: 'partner-toggled' };
  }

  @Post('access')
  @HttpCode(200)
  async registerAccess(@Body() dto: RegisterAccessDto) {
    // A rota original de access devolve 200 independente do que aconteça para não revelar dados
    try {
      await this.partnersService.registerAccess(dto);
    } catch {
      // Ignora erro como no código original
    }
    return { ok: true };
  }
}
