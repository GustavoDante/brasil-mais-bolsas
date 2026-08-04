/**
 * Formato do arquivo entregue pelo multer quando usamos `memoryStorage` (padrao do
 * `FileInterceptor`). Declarado aqui para nao depender do namespace global
 * `Express.Multer` (`@types/multer`) e manter a tipagem estrita.
 */
export interface UploadedFileData {
  /** Nome do campo do formulario multipart (ex: `file`, `image`) */
  fieldname: string;
  /** Nome do arquivo na maquina do usuario — NUNCA usar direto para montar caminhos */
  originalname: string;
  encoding: string;
  /** Content-Type informado pelo cliente — nao confiavel, validado contra os magic numbers */
  mimetype: string;
  /** Tamanho em bytes */
  size: number;
  /** Conteudo do arquivo em memoria */
  buffer: Buffer;
}
