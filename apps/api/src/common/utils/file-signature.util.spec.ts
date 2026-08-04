import { UPLOAD_KEY_PATTERN } from '../constants/upload.constants';
import { buildObjectKey, detectFileType, sanitizeFileName } from './file-signature.util';

const png = () => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
const jpeg = () => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const gif = () => Buffer.from('GIF89a-conteudo-qualquer');
const webp = () => Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]);
const pdf = () => Buffer.from('%PDF-1.7\n conteudo');

describe('file-signature.util', () => {
  describe('detectFileType', () => {
    it('deve detectar PNG pela assinatura', () => {
      expect(detectFileType(png())?.mime).toBe('image/png');
    });

    it('deve detectar JPEG pela assinatura', () => {
      expect(detectFileType(jpeg())?.mime).toBe('image/jpeg');
    });

    it('deve detectar GIF pela assinatura', () => {
      expect(detectFileType(gif())?.mime).toBe('image/gif');
    });

    it('deve detectar WEBP pelos marcadores RIFF/WEBP', () => {
      expect(detectFileType(webp())?.mime).toBe('image/webp');
    });

    it('deve detectar PDF pela assinatura', () => {
      expect(detectFileType(pdf())?.mime).toBe('application/pdf');
    });

    it('deve retornar null para conteudo desconhecido (ex: script php)', () => {
      expect(detectFileType(Buffer.from('<?php system($_GET["c"]); ?>'))).toBeNull();
    });

    it('deve retornar null para SVG (nao permitido)', () => {
      expect(
        detectFileType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')),
      ).toBeNull();
    });

    it('deve retornar null para buffer vazio', () => {
      expect(detectFileType(Buffer.alloc(0))).toBeNull();
    });

    it('deve retornar null para buffer menor que a assinatura', () => {
      expect(detectFileType(Buffer.from([0x89, 0x50]))).toBeNull();
    });
  });

  describe('sanitizeFileName', () => {
    it('deve remover diretorios do nome (path traversal)', () => {
      expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFileName('C:\\Users\\admin\\logo.png')).toBe('logo.png');
    });

    it('deve trocar caracteres fora da lista por hifen', () => {
      expect(sanitizeFileName('logo da faculdade (2).png')).toBe('logo-da-faculdade-2-.png');
    });

    it('deve remover caracteres de controle', () => {
      expect(sanitizeFileName('logo\u0000\u001f.png')).toBe('logo.png');
    });

    it('deve devolver nome padrao quando sobra vazio', () => {
      expect(sanitizeFileName('...')).toBe('arquivo');
      expect(sanitizeFileName('')).toBe('arquivo');
    });

    it('deve limitar o tamanho do nome', () => {
      expect(sanitizeFileName(`${'a'.repeat(300)}.png`).length).toBe(100);
    });
  });

  describe('buildObjectKey', () => {
    it('deve montar a key no formato pasta/ano/mes/uuid.ext', () => {
      const key = buildObjectKey('institutions', '.png', new Date(Date.UTC(2026, 6, 31)));

      expect(key).toMatch(/^institutions\/2026\/07\//);
      expect(key.endsWith('.png')).toBe(true);
      expect(UPLOAD_KEY_PATTERN.test(key)).toBe(true);
    });

    it('deve gerar keys diferentes para o mesmo arquivo', () => {
      expect(buildObjectKey('misc', '.pdf')).not.toBe(buildObjectKey('misc', '.pdf'));
    });
  });

  describe('UPLOAD_KEY_PATTERN', () => {
    it('deve rejeitar key com path traversal ou pasta desconhecida', () => {
      expect(UPLOAD_KEY_PATTERN.test('../secrets/key.png')).toBe(false);
      expect(UPLOAD_KEY_PATTERN.test('backups/2026/07/dump.png')).toBe(false);
      expect(UPLOAD_KEY_PATTERN.test('institutions/2026/07/logo.png')).toBe(false);
    });
  });
});
