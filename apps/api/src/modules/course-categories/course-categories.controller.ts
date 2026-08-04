import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CourseCategoriesService } from './course-categories.service';
import { CreateCourseCategoryDto, UpdateCourseCategoryDto } from './dto/course-categories.dto';

type JwtRequest = Request & { user: JwtUser };

@ApiTags('course-categories')
@Controller('course-categories')
export class CourseCategoriesController {
  constructor(private readonly courseCategoriesService: CourseCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias de cursos (Público)' })
  @ApiResponse({ status: 200 })
  async findAll() {
    const courseCategories = await this.courseCategoriesService.findAll();
    return { ok: true, courseCategories };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buscar categoria de curso por ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  async findById(@Param('id') id: string) {
    const courseCategory = await this.courseCategoriesService.findById(id);
    return { ok: true, courseCategory };
  }

  @Get('old_id/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buscar categoria de curso pelo old_id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  async findByOldId(@Param('id') id: string) {
    const courseCategory = await this.courseCategoriesService.findByOldId(id);
    return { ok: true, courseCategory };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar categoria de curso (admin)' })
  @ApiBody({ type: CreateCourseCategoryDto })
  @ApiResponse({ status: 201, description: 'course-category-created' })
  async create(@Body() dto: CreateCourseCategoryDto, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.courseCategoriesService.create(dto);
    return { ok: true, message: 'course-category-created' };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar categoria de curso (admin)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateCourseCategoryDto })
  @ApiResponse({ status: 200, description: 'course-category-updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseCategoryDto,
    @Req() req: JwtRequest,
  ) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.courseCategoriesService.update(id, dto);
    return { ok: true, message: 'course-category-updated' };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft delete de categoria de curso (admin)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'course-category-deleted' })
  async remove(@Param('id') id: string, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.courseCategoriesService.softDelete(id);
    return { ok: true, message: 'course-category-deleted' };
  }

  @Patch(':id/toggle')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ativar/desativar categoria de curso (admin)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'category-toggled' })
  async toggle(@Param('id') id: string, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.courseCategoriesService.toggleActive(id);
    return { ok: true, message: 'category-toggled' };
  }
}
