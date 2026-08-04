import {
  Body,
  Controller,
  Delete,
  ParseFilePipe,
  Post,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  DEFAULT_UPLOAD_FOLDER,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  UPLOAD_FOLDERS,
} from '../../common/constants/upload.constants';
import type { UploadedFileData } from '../../common/types/uploaded-file.type';
import { SecureFileValidator } from '../../common/validators/secure-file.validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { DeleteFileResponseDto, UploadedFileResponseDto } from './dto/upload-response.dto';
import { DeleteFileDto, UploadFileDto } from './dto/uploads.dto';
import { UploadsService } from './uploads.service';
import { AppException } from '../../common/exceptions/app.exception';

type JwtRequest = Request & { user: JwtUser };

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  // Upload e caro (banda + armazenamento): limite bem menor que o global de 100/min
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @UseInterceptors(
    FileInterceptor('file', {
      // Corta o corpo da requisicao no limite antes de carregar tudo em memoria
      limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES, files: 1, fields: 5 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Enviar um arquivo para o bucket S3',
    description:
      'Recebe um `multipart/form-data` com o campo `file` e devolve a URL publica. ' +
      'O tipo do arquivo e determinado pelos magic numbers do conteudo (PNG, JPEG, GIF, ' +
      'WEBP ou PDF); o `Content-Type` e a extensao enviados precisam ser coerentes com ele.',
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Arquivo (max. 5 MB)' },
        folder: {
          type: 'string',
          enum: [...UPLOAD_FOLDERS],
          default: DEFAULT_UPLOAD_FOLDER,
          description: 'Pasta de destino dentro do bucket',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: UploadedFileResponseDto })
  @ApiResponse({ status: 400, description: 'Arquivo ausente, corrompido ou de tipo nao permitido' })
  @ApiResponse({ status: 401, description: 'Token ausente ou invalido' })
  @ApiResponse({ status: 413, description: 'Arquivo maior que o limite' })
  @ApiResponse({ status: 429, description: 'Limite de requisicoes excedido' })
  @ApiResponse({ status: 503, description: 'Bucket nao configurado (storage-not-configured)' })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new SecureFileValidator({ maxSizeBytes: MAX_UPLOAD_FILE_SIZE_BYTES })],
      }),
    )
    file: UploadedFileData,
    @Body() dto: UploadFileDto,
  ): Promise<UploadedFileResponseDto> {
    const stored = await this.uploadsService.upload(file, dto.folder ?? DEFAULT_UPLOAD_FOLDER);

    return {
      url: stored.url,
      key: stored.key,
      content_type: stored.contentType,
      size: stored.size,
    };
  }

  @Delete()
  @ApiOperation({
    summary: 'Remover um arquivo do bucket (admin)',
    description: 'Aceita apenas keys no formato gerado pelo upload (`pasta/ano/mes/uuid.ext`).',
  })
  @ApiQuery({ name: 'key', required: true, description: 'Key do objeto no bucket' })
  @ApiResponse({ status: 200, type: DeleteFileResponseDto })
  @ApiResponse({ status: 400, description: 'key-invalida' })
  @ApiResponse({ status: 403, description: 'unauthorized' })
  async remove(
    @Query() query: DeleteFileDto,
    @Req() req: JwtRequest,
  ): Promise<DeleteFileResponseDto> {
    if (req.user.type !== 'admin') throw new AppException('forbidden');

    await this.uploadsService.remove(query.key);

    return { ok: true, message: 'file-deleted' };
  }
}
