import { IMAGE_MIME_TYPES } from '../constants/upload.constants';
import type { UploadedFileData } from '../types/uploaded-file.type';
import { SecureFileValidator } from './secure-file.validator';

const pngBuffer = () =>
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);

const pdfBuffer = () => Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(64)]);

const makeFile = (overrides: Partial<UploadedFileData> = {}): UploadedFileData => {
  const buffer = overrides.buffer ?? pngBuffer();

  return {
    fieldname: 'file',
    originalname: 'logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: buffer.length,
    ...overrides,
    buffer,
  };
};

describe('SecureFileValidator', () => {
  const validator = new SecureFileValidator({ maxSizeBytes: 1024 });

  it('deve aceitar um PNG coerente com o mimetype e a extensao', () => {
    expect(validator.isValid(makeFile())).toBe(true);
  });

  it('deve aceitar extensao alternativa do mesmo tipo (jpg/jpeg)', () => {
    const buffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(64)]);
    const file = makeFile({ buffer, mimetype: 'image/jpeg', originalname: 'foto.jpeg' });

    expect(validator.isValid(file)).toBe(true);
  });

  it('deve aceitar arquivo sem extensao no nome original', () => {
    expect(validator.isValid(makeFile({ originalname: 'logo' }))).toBe(true);
  });

  it('deve recusar quando nenhum arquivo e enviado', () => {
    expect(validator.isValid(undefined)).toBe(false);
    expect(validator.buildErrorMessage(undefined)).toBe('arquivo-obrigatorio');
  });

  it('deve recusar arquivo vazio ou truncado', () => {
    const file = makeFile({ buffer: Buffer.from([0x89, 0x50]) });

    expect(validator.isValid(file)).toBe(false);
    expect(validator.buildErrorMessage(file)).toBe('arquivo-vazio-ou-truncado');
  });

  it('deve recusar arquivo acima do tamanho maximo', () => {
    const small = new SecureFileValidator({ maxSizeBytes: 32 });
    const file = makeFile();

    expect(small.isValid(file)).toBe(false);
    expect(small.buildErrorMessage(file)).toContain('arquivo-excede-o-tamanho-maximo');
  });

  it('deve recusar quando o size informado nao bate com o buffer', () => {
    const file = makeFile({ size: 1 });

    expect(validator.isValid(file)).toBe(false);
    expect(validator.buildErrorMessage(file)).toBe('tamanho-do-arquivo-inconsistente');
  });

  it('deve recusar conteudo que nao corresponde a nenhum tipo suportado', () => {
    const file = makeFile({
      buffer: Buffer.from('<?php system($_GET["cmd"]); ?> padding padding padding'),
      mimetype: 'image/png',
    });

    expect(validator.isValid(file)).toBe(false);
    expect(validator.buildErrorMessage(file)).toBe('tipo-de-arquivo-nao-suportado');
  });

  it('deve recusar mimetype declarado diferente do conteudo real', () => {
    const file = makeFile({ mimetype: 'image/gif', originalname: 'logo.png' });

    expect(validator.isValid(file)).toBe(false);
    expect(validator.buildErrorMessage(file)).toBe(
      'content-type-declarado-nao-corresponde-ao-conteudo-do-arquivo',
    );
  });

  it('deve recusar extensao incompativel com o conteudo real (ex: .php com bytes de PNG)', () => {
    const file = makeFile({ originalname: 'shell.php' });

    expect(validator.isValid(file)).toBe(false);
    expect(validator.buildErrorMessage(file)).toBe(
      'extensao-do-arquivo-nao-corresponde-ao-conteudo',
    );
  });

  it('deve recusar PDF em rota que aceita apenas imagens', () => {
    const onlyImages = new SecureFileValidator({ allowedMimeTypes: IMAGE_MIME_TYPES });
    const file = makeFile({
      buffer: pdfBuffer(),
      mimetype: 'application/pdf',
      originalname: 'contrato.pdf',
    });

    expect(onlyImages.isValid(file)).toBe(false);
    expect(onlyImages.buildErrorMessage(file)).toContain(
      'tipo-de-arquivo-nao-permitido-nesta-rota',
    );
  });

  it('deve aceitar PDF quando a rota nao restringe os tipos', () => {
    const file = makeFile({
      buffer: pdfBuffer(),
      mimetype: 'application/pdf',
      originalname: 'contrato.pdf',
    });

    expect(validator.isValid(file)).toBe(true);
  });

  it('deve ignorar parametros do content-type (charset)', () => {
    expect(validator.isValid(makeFile({ mimetype: 'image/png; charset=utf-8' }))).toBe(true);
  });
});
