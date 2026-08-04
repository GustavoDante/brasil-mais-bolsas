import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/courses.dto';
import { AppException } from '../../common/exceptions/app.exception';

type JwtRequest = Request & { user: JwtUser };

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar cursos' })
  @ApiResponse({ status: 200 })
  async findAll(@Req() req: JwtRequest) {
    const { type, institution_id } = req.user;
    const courses = await this.coursesService.findAll(type, institution_id);
    return { ok: true, courses };
  }

  @Get('institution/:id')
  @ApiOperation({ summary: 'Listar cursos filtrados por nome da instituição (ilegível legado)' })
  @ApiParam({
    name: 'id',
    description: 'Apesar de ser ID, o sistema legado espera o NOME da instituição aqui',
  })
  @ApiResponse({ status: 200 })
  async findByInstitutionName(@Param('id') id: string) {
    // legacy compatibility - params.id in this route is actually an institution name
    const courses = await this.coursesService.findByInstitutionName(id);
    return { ok: true, courses };
  }

  @Get('search')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buscar cursos por nome' })
  @ApiQuery({ name: 'term', required: true })
  @ApiResponse({ status: 200 })
  async search(@Query('term') term: string) {
    const courses = await this.coursesService.searchByName(term || '');
    return { ok: true, courses };
  }

  @Get('id/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buscar curso por ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  async findById(@Param('id') id: string) {
    const course = await this.coursesService.findById(id);
    return { ok: true, course };
  }

  @Get('old_id/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buscar curso por old_id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  async findByOldId(@Param('id') id: string) {
    const course = await this.coursesService.findByOldId(id);
    return { ok: true, course };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar curso (admin)' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'course-created' })
  async create(@Body() dto: CreateCourseDto, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.coursesService.create(dto);
    return { ok: true, message: 'course-created' };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar curso (admin)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ status: 200, description: 'course-updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.coursesService.update(id, dto);
    return { ok: true, message: 'course-updated' };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft delete de curso (admin)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'course-deleted' })
  async remove(@Param('id') id: string, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.coursesService.softDelete(id);
    return { ok: true, message: 'course-deleted' };
  }

  @Patch(':id/toggle')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ativar/desativar curso (admin)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'course-toggled' })
  async toggle(@Param('id') id: string, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.coursesService.toggleActive(id);
    return { ok: true, message: 'course-toggled' };
  }
}
