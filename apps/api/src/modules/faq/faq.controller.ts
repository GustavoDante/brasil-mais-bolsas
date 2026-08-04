import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { FaqService } from './faq.service';
import { AppException } from '../../common/exceptions/app.exception';

@ApiTags('FAQ')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma pergunta frequente (Apenas Admin)' })
  @ApiResponse({ status: 201, description: 'FAQ criada com sucesso' })
  async create(@Body() dto: CreateFaqDto, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new AppException('forbidden');
    }

    const faq = await this.faqService.create(dto);
    return { ok: true, message: 'faq-created', faq };
  }

  @Get()
  @ApiOperation({ summary: 'Lista perguntas frequentes públicas' })
  async findAll() {
    const faqs = await this.faqService.findAll();
    return { ok: true, faqs };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma FAQ por id' })
  async findOne(@Param('id') id: string) {
    const faq = await this.faqService.findOne(id);
    return { ok: true, faq };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza uma FAQ (Apenas Admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFaqDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.type !== 'admin') {
      throw new AppException('forbidden');
    }

    const faq = await this.faqService.update(id, dto);
    return { ok: true, message: 'faq-updated', faq };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove uma FAQ (Apenas Admin)' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') {
      throw new AppException('forbidden');
    }

    await this.faqService.remove(id);
    return { ok: true, message: 'faq-deleted' };
  }
}
