import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { ApiErrorDto } from './common/dto/api-error.dto';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // Prefixo global de versão (compatibilidade com projeto antigo)
  app.setGlobalPrefix('v1');

  // Headers de segurança HTTP
  app.use(helmet());

  // CORS — em produção, substituir allowedOrigins por variável de ambiente
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  });

  // Validação global — os schemas vêm de `@repo/contracts`, compartilhados com o web.
  //
  // Equivalências com o `ValidationPipe` que estava aqui antes:
  // - `forbidNonWhitelisted` (400 em campo extra) → `.strict()` nos schemas de body;
  // - `whitelist` (remove campo não declarado)    → comportamento padrão do Zod;
  // - `transform` (coerção de query e datas)      → blocos `zQuery*` e `zDateInput`.
  //
  // Os dois pipes NÃO podem coexistir: o `ValidationPipe`, ao ver um `ZodDto` (que não tem
  // decorators de class-validator), apagaria todos os campos antes do Zod rodar.
  app.useGlobalPipes(new ZodValidationPipe());

  // Filtro global de exceções. Toda falha sai daqui como `{ ok: false, code, message }`,
  // com código e texto vindos do `ERROR_CATALOG` de `@repo/contracts` — o frontend exibe a
  // mensagem como veio e decide comportamento pelo código.
  app.useGlobalFilters(new AllExceptionsFilter());

  const enableSwagger =
    process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true';

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Brasil Mais Bolsas API')
      .setDescription('Documentacao da API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      // O corpo de erro é o mesmo em todas as rotas e não aparece em nenhum handler —
      // sem isto, `/docs` documentaria só os caminhos de sucesso.
      extraModels: [ApiErrorDto],
    });
    // `cleanupOpenApiDoc` converte os schemas Zod para OpenAPI. Sem ele os `ZodDto`
    // aparecem vazios em /docs.
    SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
