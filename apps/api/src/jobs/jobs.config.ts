/**
 * Configuração compartilhada pelos agendamentos.
 *
 * Lida diretamente de `process.env` porque as opções do decorator `@Cron` são avaliadas
 * na definição da classe, antes de qualquer injeção de dependência acontecer.
 */

/** Fuso usado por todos os jobs (o legado rodava em America/Sao_Paulo). */
export const JOBS_TIMEZONE = process.env['JOBS_TIMEZONE'] ?? 'America/Sao_Paulo';

/**
 * `JOBS_ENABLED=false` desliga todos os agendamentos sem remover código — útil em
 * ambientes de teste/homologação e em réplicas que não devem executar tarefas.
 * A execução manual pela rota administrativa continua funcionando.
 */
export const JOBS_DISABLED = process.env['JOBS_ENABLED'] === 'false';
