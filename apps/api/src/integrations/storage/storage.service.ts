import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildObjectKey, sanitizeFileName } from '../../common/utils/file-signature.util';
import type { StorageUploadInput, StoredFile } from './types/storage.types';

const DEFAULT_REGION = 'sa-east-1';

/**
 * Adaptador do Amazon S3 — porte do `src/services/uploadImage.js` do projeto antigo, que
 * usava `multer-s3` com credenciais no codigo-fonte.
 *
 * Diferencas em relacao ao legado:
 * - credenciais vem do ambiente (ou da cadeia padrao da AWS: IAM role, `~/.aws`, etc.);
 * - a key do objeto e gerada pela aplicacao (`pasta/ano/mes/uuid.ext`), sem nome de
 *   arquivo enviado pelo cliente;
 * - o `Content-Type` gravado e o tipo detectado pelo conteudo, nao o declarado;
 * - o objeto sobe com criptografia em repouso (SSE-S3) e sem ACL (buckets novos bloqueiam
 *   ACLs; o acesso publico de leitura deve vir de bucket policy ou CloudFront).
 */
@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleDestroy(): void {
    this.client?.destroy();
    this.client = null;
  }

  /** `true` quando ha bucket configurado — usado para degradar a rota com 503 claro. */
  get isConfigured(): boolean {
    return Boolean(this.configService.get<string>('AWS_S3_BUCKET'));
  }

  async upload(input: StorageUploadInput): Promise<StoredFile> {
    const bucket = this.requireBucket();
    const key = buildObjectKey(input.folder, input.extension);
    const originalName = input.originalName ? sanitizeFileName(input.originalName) : undefined;

    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType,
        ContentLength: input.buffer.length,
        // PDFs sao baixados em vez de renderizados no dominio do bucket
        ContentDisposition:
          input.contentType === 'application/pdf'
            ? `attachment${originalName ? `; filename="${originalName}"` : ''}`
            : 'inline',
        CacheControl: 'public, max-age=31536000, immutable',
        ServerSideEncryption: 'AES256',
        Metadata: originalName ? { 'original-name': originalName } : undefined,
      }),
    );

    return {
      key,
      url: this.buildPublicUrl(key),
      contentType: input.contentType,
      size: input.buffer.length,
    };
  }

  async remove(key: string): Promise<void> {
    const bucket = this.requireBucket();

    await this.getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  /**
   * Remove um arquivo a partir da URL salva no banco. Silenciosamente ignora URLs de
   * outros dominios (imagens legadas apontam para hosts diversos) e nunca propaga o erro:
   * falhar ao apagar o arquivo antigo nao pode derrubar a atualizacao do registro.
   */
  async removeByUrlSafely(url?: string | null): Promise<void> {
    const key = this.extractKey(url);
    if (!key) return;

    try {
      await this.remove(key);
    } catch (error) {
      this.logger.warn(
        `Falha ao remover o objeto "${key}" do bucket: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  buildPublicUrl(key: string): string {
    const publicUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL');

    if (publicUrl) {
      return `${publicUrl.replace(/\/+$/, '')}/${key}`;
    }

    return `https://${this.requireBucket()}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /** Extrai a key de uma URL, desde que ela pertenca ao bucket/CDN configurado. */
  extractKey(url?: string | null): string | null {
    if (!url || !this.isConfigured) return null;

    const bases = [this.buildPublicUrl('')];
    const publicUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL');

    if (publicUrl) {
      // Mesmo com CDN configurado, aceita a URL direta do bucket (arquivos antigos)
      bases.push(`https://${this.requireBucket()}.s3.${this.region}.amazonaws.com/`);
    }

    const base = bases.find((candidate) => url.startsWith(candidate));
    if (!base) return null;

    const key = decodeURIComponent(url.slice(base.length)).split('?')[0];

    return key.length > 0 ? key : null;
  }

  private get region(): string {
    return this.configService.get<string>('AWS_REGION') ?? DEFAULT_REGION;
  }

  private requireBucket(): string {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    if (!bucket) {
      throw new ServiceUnavailableException('storage-not-configured');
    }

    return bucket;
  }

  private getClient(): S3Client {
    if (this.client) return this.client;

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');

    const config: S3ClientConfig = { region: this.region };

    // Sem chaves explicitas, o SDK usa a cadeia padrao de credenciais (IAM role, perfil...)
    if (accessKeyId && secretAccessKey) {
      config.credentials = { accessKeyId, secretAccessKey };
    }

    // Endpoint customizado (MinIO/LocalStack em desenvolvimento)
    if (endpoint) {
      config.endpoint = endpoint;
      config.forcePathStyle = true;
    }

    this.client = new S3Client(config);

    return this.client;
  }
}
