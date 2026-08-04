import { ApiProperty } from '@nestjs/swagger';

export class UploadedFileResponseDto {
  @ApiProperty({
    description: 'URL publica do arquivo — e o valor que deve ser salvo no cadastro',
    example:
      'https://bucketbrasilmaisbolsas.s3.sa-east-1.amazonaws.com/institutions/2026/07/2f1c4a1e-6c2e-4a3b-9d51-1a2b3c4d5e6f.png',
  })
  url!: string;

  @ApiProperty({
    description: 'Key do objeto dentro do bucket (usada para remover o arquivo)',
    example: 'institutions/2026/07/2f1c4a1e-6c2e-4a3b-9d51-1a2b3c4d5e6f.png',
  })
  key!: string;

  @ApiProperty({
    description: 'Content-Type detectado pelo conteudo do arquivo',
    example: 'image/png',
  })
  content_type!: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes', example: 34567 })
  size!: number;
}

export class DeleteFileResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'file-deleted' })
  message!: string;
}
