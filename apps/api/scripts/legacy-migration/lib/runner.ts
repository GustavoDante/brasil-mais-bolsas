import type { MigrationContext, MigrationStep } from './context';

/**
 * Runs the steps in order. Each step resolves its legacy table by introspection; a step whose
 * table does not exist is reported as `no-source` instead of aborting the migration, and a
 * step that throws is reported as `failed` while the remaining steps keep going.
 */
export async function runSteps(
  ctx: MigrationContext,
  steps: MigrationStep[],
  log: (message: string) => void = () => {},
): Promise<void> {
  for (const step of steps) {
    const table = await ctx.legacy.resolveTable(step.sources);
    const stat = ctx.report.startStep(step.name, table);
    const startedAt = Date.now();

    if (!table) {
      stat.status = 'no-source';
      stat.message = `tabela não encontrada (${step.sources.join(', ')})`;
      log(`- ${step.name}: tabela legada não encontrada, passo ignorado`);
      continue;
    }

    try {
      await step.run(ctx, table);
      stat.status = 'ok';
    } catch (error) {
      stat.status = 'failed';
      stat.message = error instanceof Error ? error.message.split('\n')[0] : String(error);
      ctx.report.failed(step.name, '-', 'passo-interrompido', stat.message);
    } finally {
      stat.durationMs = Date.now() - startedAt;
    }

    log(
      `- ${step.name} (${table}): ${stat.written} de ${stat.read} em ${(stat.durationMs / 1000).toFixed(1)}s` +
        `${stat.status === 'failed' ? ` FALHOU: ${stat.message}` : ''}`,
    );
  }
}
