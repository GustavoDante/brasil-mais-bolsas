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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CityListResponseDto,
  CityResponseDto,
  CourseListResponseDto,
  CourseMiniDto,
  InstitutionListResponseDto,
  InstitutionMiniDto,
  ScholarshipItemDto,
  ScholarshipListResponseDto,
  ScholarshipResponseDto,
} from './dto/scholarships-response.dto';
import {
  ChangeScholarshipOrderDto,
  CreateNewScholarshipValueDto,
  CreateScholarshipDto,
  ScholarshipListQueryDto,
  UpdateScholarshipDto,
} from './dto/scholarships.dto';
import { ScholarshipsService } from './scholarships.service';

export interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    type: string;
    institution_id?: string;
  };
}

@ApiTags('Scholarships')
@Controller('scholarships')
export class ScholarshipsController {
  constructor(private readonly scholarshipsService: ScholarshipsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar nova bolsa (Admin)' })
  @ApiResponse({ status: 201, type: ScholarshipResponseDto })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async create(
    @Body() dto: CreateScholarshipDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ScholarshipResponseDto> {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    const scholarship = await this.scholarshipsService.create(dto);
    return {
      ok: true,
      message: 'scholarship-created',
      scholarship: scholarship as unknown as ScholarshipItemDto,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar bolsas (Admin ou Manager)' })
  @ApiResponse({ status: 200, type: ScholarshipListResponseDto })
  async findAll(@Req() req: AuthenticatedRequest): Promise<ScholarshipListResponseDto> {
    const institutionId = req.user.type === 'manager' ? req.user.institution_id : undefined;
    const scholarships = await this.scholarshipsService.findAllForManager(institutionId);
    return { ok: true, scholarships: scholarships as unknown as ScholarshipItemDto[] };
  }

  @Get('list/random')
  @ApiOperation({ summary: 'Listar bolsas aleatórias para o site' })
  @ApiResponse({ status: 200, type: ScholarshipListResponseDto })
  async listRandom(@Query() query: ScholarshipListQueryDto): Promise<ScholarshipListResponseDto> {
    const scholarships = await this.scholarshipsService.listRandom(query);
    return { ok: true, scholarships: scholarships as unknown as ScholarshipItemDto[] };
  }

  @Get('list/order')
  @ApiOperation({ summary: 'Listar bolsas ordenadas por categoria' })
  @ApiResponse({ status: 200, type: ScholarshipListResponseDto })
  async listOrder(@Query() query: ScholarshipListQueryDto): Promise<ScholarshipListResponseDto> {
    const scholarships = await this.scholarshipsService.listOrder(query);
    return { ok: true, scholarships: scholarships as unknown as ScholarshipItemDto[] };
  }

  @Get('search/city')
  @ApiOperation({ summary: 'Buscar cidades que possuem bolsas ativas' })
  @ApiResponse({ status: 200, type: CityListResponseDto })
  async searchCity(@Query('term') term: string): Promise<CityListResponseDto> {
    const cities = await this.scholarshipsService.searchCity(term);
    return { ok: true, cities: cities };
  }

  @Get('list/city')
  @ApiOperation({ summary: 'Listar todas as cidades com bolsas' })
  @ApiResponse({ status: 200, type: CityListResponseDto })
  async listCity(): Promise<CityListResponseDto> {
    const cities = await this.scholarshipsService.listCity();
    return { ok: true, cities: cities as unknown as CityResponseDto[] };
  }

  @Get('search/institution')
  @ApiOperation({ summary: 'Buscar instituições com bolsas' })
  @ApiResponse({ status: 200, type: InstitutionListResponseDto })
  async searchInstitution(@Query('term') term: string): Promise<InstitutionListResponseDto> {
    const institutions = await this.scholarshipsService.searchInstitution(term);
    return { ok: true, institutions: institutions as unknown as InstitutionMiniDto[] };
  }

  @Get('list/institution/bycity')
  @ApiOperation({ summary: 'Listar instituições por cidade e categoria' })
  @ApiResponse({ status: 200, type: InstitutionListResponseDto })
  async listInstitutionByCity(
    @Query('city') city: string,
    @Query('category') category: string,
  ): Promise<InstitutionListResponseDto> {
    const institutions = await this.scholarshipsService.listInstitutionByCity(city, category);
    return { ok: true, institutions: institutions as unknown as InstitutionMiniDto[] };
  }

  @Get('list/course/bycity')
  @ApiOperation({ summary: 'Listar cursos por cidade e categoria' })
  @ApiResponse({ status: 200, type: CourseListResponseDto })
  async listCourseByCity(
    @Query('city') city: string,
    @Query('category') category: string,
  ): Promise<CourseListResponseDto> {
    const courses = await this.scholarshipsService.listCourseByCity(city, category);
    return { ok: true, courses: courses as unknown as CourseMiniDto[] };
  }

  @Get('search/course')
  @ApiOperation({ summary: 'Buscar cursos que possuem bolsas' })
  @ApiResponse({ status: 200, type: CourseListResponseDto })
  async searchCourse(@Query('term') term: string): Promise<CourseListResponseDto> {
    const courses = await this.scholarshipsService.searchCourse(term);
    return { ok: true, courses: courses as unknown as CourseMiniDto[] };
  }

  @Get('list/index')
  @ApiOperation({ summary: 'Listar bolsas para a home (index)' })
  @ApiResponse({ status: 200, type: ScholarshipListResponseDto })
  async getIndexList(): Promise<ScholarshipListResponseDto> {
    const scholarships = await this.scholarshipsService.getIndexList();
    return { ok: true, scholarships: scholarships as ScholarshipItemDto[] };
  }

  @Get('list/backoffice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar bolsas para o backoffice (Admin/Manager)' })
  @ApiResponse({ status: 200, type: ScholarshipListResponseDto })
  async listBackoffice(
    @Req() req: AuthenticatedRequest,
    @Query() query: ScholarshipListQueryDto,
  ): Promise<ScholarshipListResponseDto> {
    if (req.user.type !== 'admin' && req.user.type !== 'manager') {
      throw new ForbiddenException('unauthorized');
    }
    const scholarships = await this.scholarshipsService.listBackoffice(req.user, query);
    return { ok: true, scholarships: scholarships as unknown as ScholarshipItemDto[] };
  }

  @Get('contract/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter informações de contrato de uma bolsa' })
  @ApiParam({ name: 'id', description: 'ID da bolsa' })
  async getContractInfo(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const result = await this.scholarshipsService.getContractInfo(id, req.user.userId);
    return { ok: true, ...result };
  }

  @Get('renew/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter informações para renovação de bolsa' })
  @ApiParam({ name: 'id', description: 'ID da bolsa' })
  @ApiResponse({ status: 200, type: ScholarshipResponseDto })
  async getRenewInfo(@Param('id') id: string): Promise<ScholarshipResponseDto> {
    const scholarship = await this.scholarshipsService.findById(id);
    return { ok: true, scholarship: scholarship as unknown as ScholarshipItemDto };
  }

  @Get('students_count/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contagem de alunos matriculados na bolsa (Admin)' })
  @ApiParam({ name: 'id', description: 'ID da bolsa' })
  async getStudentsCount(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    const students_count = await this.scholarshipsService.getStudentsCount(id);
    return { ok: true, students_count };
  }

  @Post('change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar bolsa de um pedido existente (Admin)' })
  async changeOrderScholarship(
    @Body() dto: ChangeScholarshipOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    const order = await this.scholarshipsService.changeOrderScholarship(dto);
    return { ok: true, order };
  }

  @Get('old_id/:id')
  @ApiOperation({ summary: 'Buscar bolsa pelo ID do sistema antigo' })
  @ApiParam({ name: 'id', description: 'ID antigo' })
  @ApiResponse({ status: 200, type: ScholarshipResponseDto })
  async findByOldId(@Param('id') id: string): Promise<ScholarshipResponseDto> {
    const scholarship = await this.scholarshipsService.findByOldId(id);
    return { ok: true, scholarship: scholarship as unknown as ScholarshipItemDto };
  }

  @Post('new_value')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar valor de uma bolsa criando uma nova versão (Admin)' })
  @ApiResponse({ status: 201, type: ScholarshipResponseDto })
  async createNewValue(
    @Body() dto: CreateNewScholarshipValueDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ScholarshipResponseDto> {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    // Desativar a antiga
    await this.scholarshipsService.update(dto.scholarship_id, { active: false });
    // Criar a nova
    const scholarship = await this.scholarshipsService.create(dto);
    return {
      ok: true,
      message: 'scholarship-created',
      scholarship: scholarship as unknown as ScholarshipItemDto,
    };
  }

  @Get('list/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as bolsas com filtros' })
  @ApiResponse({ status: 200, type: ScholarshipListResponseDto })
  async listAll(@Query() query: ScholarshipListQueryDto): Promise<ScholarshipListResponseDto> {
    const scholarships = await this.scholarshipsService.listAll(query);
    return { ok: true, scholarships: scholarships as unknown as ScholarshipItemDto[] };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar bolsa por ID' })
  @ApiParam({ name: 'id', description: 'ID da bolsa' })
  @ApiResponse({ status: 200, type: ScholarshipResponseDto })
  async findById(@Param('id') id: string): Promise<ScholarshipResponseDto> {
    const scholarship = await this.scholarshipsService.findById(id);
    return { ok: true, scholarship: scholarship as unknown as ScholarshipItemDto };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados da bolsa (Admin)' })
  @ApiParam({ name: 'id', description: 'ID da bolsa' })
  @ApiResponse({ status: 200, type: ScholarshipResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScholarshipDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ScholarshipResponseDto> {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.scholarshipsService.update(id, dto);
    return { ok: true, message: 'scholarship-updated' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover bolsa (Soft Delete, Admin)' })
  @ApiParam({ name: 'id', description: 'ID da bolsa' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.scholarshipsService.softDelete(id);
    return { ok: true, message: 'scholarship-deleted' };
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar/Desativar bolsa (Admin)' })
  @ApiParam({ name: 'id', description: 'ID da bolsa' })
  async toggleActive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.type !== 'admin') throw new ForbiddenException('unauthorized');
    await this.scholarshipsService.toggleActive(id);
    return { ok: true, message: 'scholarship-toggled' };
  }
}
