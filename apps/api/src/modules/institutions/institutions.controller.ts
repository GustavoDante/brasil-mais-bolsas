import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  IMAGE_MIME_TYPES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
} from '../../common/constants/upload.constants';
import type { UploadedFileData } from '../../common/types/uploaded-file.type';
import { SecureFileValidator } from '../../common/validators/secure-file.validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { InstitutionListResponseDto, InstitutionResponseDto } from './dto/institution-response.dto';
import { CreateInstitutionDto, UpdateInstitutionDto } from './dto/institutions.dto';
import { InstitutionsService } from './institutions.service';
import { AppException } from '../../common/exceptions/app.exception';

type JwtRequest = Request & { user: JwtUser };

/**
 * Logo da instituicao. Como no projeto antigo, a mesma rota aceita o arquivo em
 * `multipart/form-data` (campo `image`); em `application/json` o multer nao intercepta
 * nada e o campo `image` continua valendo como URL.
 */
const InstitutionImageInterceptor = FileInterceptor('image', {
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES, files: 1, fields: 50 },
});

const institutionImagePipe = new ParseFilePipe({
  validators: [
    new SecureFileValidator({
      maxSizeBytes: MAX_UPLOAD_FILE_SIZE_BYTES,
      allowedMimeTypes: IMAGE_MIME_TYPES,
    }),
  ],
  fileIsRequired: false,
});

@ApiTags('institutions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar instituicoes' })
  @ApiResponse({ status: 200, type: InstitutionListResponseDto })
  async findAll(@Req() req: JwtRequest): Promise<InstitutionListResponseDto> {
    const { type, userId, institution_id } = req.user;
    const institutions = await this.institutionsService.findAll(type, userId, institution_id);
    return { institutions };
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar instituicoes por nome' })
  @ApiQuery({ name: 'term', required: true, description: 'Termo para busca no nome' })
  @ApiResponse({ status: 200, type: InstitutionListResponseDto })
  async search(@Query('term') term: string): Promise<InstitutionListResponseDto> {
    const institutions = await this.institutionsService.searchByName(term || '');
    return { institutions };
  }

  @Get('search/by_city')
  @ApiOperation({
    summary: 'Buscar instituicoes distintas por cidade que possuem bolsas ativas',
  })
  @ApiQuery({
    name: 'term',
    required: true,
    description: 'Termo para busca no nome da cidade',
  })
  @ApiResponse({ status: 200 })
  // Retorna objeto menor {id, name} em listagem 'courses' pelo padrao antigo
  async searchByCity(
    @Query('term') term: string,
  ): Promise<{ courses: { id: string; name: string }[] }> {
    const courses = await this.institutionsService.searchByCity(term || '');
    return { courses: courses };
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Buscar instituicao por ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: InstitutionResponseDto })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  async findById(@Param('id') id: string): Promise<{ institution: InstitutionResponseDto }> {
    const institution = await this.institutionsService.findById(id);
    if (!institution) throw new AppException('institution-not-found');
    return { institution };
  }

  @Get('old_id/:id')
  @ApiOperation({ summary: 'Buscar instituicao pelo old_id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: InstitutionResponseDto })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  async findByOldId(@Param('id') id: string): Promise<{ institution: InstitutionResponseDto }> {
    const institution = await this.institutionsService.findByOldId(id);
    if (!institution) throw new AppException('institution-not-found');
    return { institution };
  }

  @Post()
  @UseInterceptors(InstitutionImageInterceptor)
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiOperation({
    summary: 'Criar instituicao (admin)',
    description:
      'Em `multipart/form-data`, o campo `image` pode ser o arquivo da logo (PNG, JPEG, ' +
      'GIF ou WEBP, max. 5 MB) — ele sobe para o S3 e a URL e gravada no cadastro. ' +
      'Em `application/json`, `image` continua sendo a URL de um upload anterior.',
  })
  @ApiBody({ type: CreateInstitutionDto })
  @ApiResponse({ status: 201, description: 'institution-created' })
  @ApiResponse({ status: 400, description: 'Arquivo de imagem invalido' })
  @ApiResponse({ status: 403, description: 'unauthorized' })
  @ApiResponse({ status: 413, description: 'Imagem maior que o limite' })
  async create(
    @Body() dto: CreateInstitutionDto,
    @Req() req: JwtRequest,
    @UploadedFile(institutionImagePipe) image?: UploadedFileData,
  ) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.institutionsService.create(dto, image);
    return { ok: true, message: 'institution-created' };
  }

  @Put(':id')
  @UseInterceptors(InstitutionImageInterceptor)
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiOperation({
    summary: 'Atualizar instituicao (admin)',
    description:
      'Aceita o campo `image` como arquivo (`multipart/form-data`) ou como URL (JSON). ' +
      'Ao enviar um arquivo novo, a imagem anterior e removida do bucket.',
  })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateInstitutionDto })
  @ApiResponse({ status: 200, description: 'institution-updated' })
  @ApiResponse({ status: 400, description: 'Arquivo de imagem invalido' })
  @ApiResponse({ status: 403, description: 'unauthorized' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  @ApiResponse({ status: 413, description: 'Imagem maior que o limite' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
    @Req() req: JwtRequest,
    @UploadedFile(institutionImagePipe) image?: UploadedFileData,
  ) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.institutionsService.update(id, dto, image);
    return { ok: true, message: 'institution-updated' };
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Ativar/desativar instituicao (admin)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'institution-toggled' })
  @ApiResponse({ status: 403, description: 'unauthorized' })
  async toggle(@Param('id') id: string, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.institutionsService.toggleActive(id);
    return { ok: true, message: 'institution-toggled' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete de instituicao (admin)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'institution-deleted' })
  @ApiResponse({ status: 403, description: 'unauthorized' })
  async remove(@Param('id') id: string, @Req() req: JwtRequest) {
    if (req.user.type !== 'admin') throw new AppException('forbidden');
    await this.institutionsService.softDelete(id);
    return { ok: true, message: 'institution-deleted' };
  }
}
