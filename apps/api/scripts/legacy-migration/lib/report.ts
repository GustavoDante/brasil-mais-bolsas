import * as fs from 'node:fs';
import * as path from 'node:path';

export type IssueKind = 'skipped' | 'coerced' | 'renamed' | 'error' | 'warning';

export interface Issue {
  step: string;
  kind: IssueKind;
  reason: string;
  legacyId: string;
  detail?: string;
}

export interface StepStats {
  step: string;
  legacyTable: string | null;
  status: 'pending' | 'ok' | 'no-source' | 'skipped' | 'failed';
  legacyRows: number;
  read: number;
  written: number;
  skipped: number;
  coerced: number;
  renamed: number;
  errors: number;
  durationMs: number;
  message?: string;
}

/** Max number of example issues kept per (step + reason); the counters keep the full totals. */
const MAX_SAMPLES = 200;

export class MigrationReport {
  readonly startedAt = new Date();
  private readonly stats = new Map<string, StepStats>();
  private readonly issueCounts = new Map<string, number>();
  private readonly samples: Issue[] = [];

  startStep(step: string, legacyTable: string | null): StepStats {
    const stat: StepStats = {
      step,
      legacyTable,
      status: 'pending',
      legacyRows: 0,
      read: 0,
      written: 0,
      skipped: 0,
      coerced: 0,
      renamed: 0,
      errors: 0,
      durationMs: 0,
    };
    this.stats.set(step, stat);
    return stat;
  }

  stat(step: string): StepStats {
    const found = this.stats.get(step);
    if (!found) return this.startStep(step, null);
    return found;
  }

  add(issue: Issue): void {
    const key = `${issue.step}::${issue.kind}::${issue.reason}`;
    const count = (this.issueCounts.get(key) ?? 0) + 1;
    this.issueCounts.set(key, count);
    if (count <= MAX_SAMPLES) this.samples.push(issue);

    const stat = this.stat(issue.step);
    if (issue.kind === 'skipped') stat.skipped += 1;
    if (issue.kind === 'coerced') stat.coerced += 1;
    if (issue.kind === 'renamed') stat.renamed += 1;
    if (issue.kind === 'error') stat.errors += 1;
  }

  skipped(step: string, legacyId: string | number, reason: string, detail?: string): void {
    this.add({ step, kind: 'skipped', reason, legacyId: String(legacyId), detail });
  }

  coerced(step: string, legacyId: string | number, reason: string, detail?: string): void {
    this.add({ step, kind: 'coerced', reason, legacyId: String(legacyId), detail });
  }

  renamed(step: string, legacyId: string | number, reason: string, detail?: string): void {
    this.add({ step, kind: 'renamed', reason, legacyId: String(legacyId), detail });
  }

  failed(step: string, legacyId: string | number, reason: string, detail?: string): void {
    this.add({ step, kind: 'error', reason, legacyId: String(legacyId), detail });
  }

  private issuesByReason(): { key: string; count: number }[] {
    return [...this.issueCounts.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }

  printSummary(dryRun: boolean): void {
    const rows = [...this.stats.values()];
    const width = {
      step: Math.max(6, ...rows.map((row) => row.step.length)),
      table: Math.max(12, ...rows.map((row) => (row.legacyTable ?? '-').length)),
    };

    const header =
      `${'PASSO'.padEnd(width.step)}  ${'TABELA LEGADA'.padEnd(width.table)}  ` +
      `${'LIDOS'.padStart(8)}  ${(dryRun ? 'SIMULA' : 'GRAVADOS').padStart(9)}  ` +
      `${'PULADOS'.padStart(8)}  ${'AJUSTES'.padStart(8)}  ${'ERROS'.padStart(6)}  STATUS`;

    console.log(`\n${header}`);
    console.log('-'.repeat(header.length));

    for (const row of rows) {
      console.log(
        `${row.step.padEnd(width.step)}  ${(row.legacyTable ?? '-').padEnd(width.table)}  ` +
          `${String(row.read).padStart(8)}  ${String(row.written).padStart(9)}  ` +
          `${String(row.skipped).padStart(8)}  ` +
          `${String(row.coerced + row.renamed).padStart(8)}  ` +
          `${String(row.errors).padStart(6)}  ${row.status}${row.message ? ` (${row.message})` : ''}`,
      );
    }

    const totals = rows.reduce(
      (acc, row) => ({
        read: acc.read + row.read,
        written: acc.written + row.written,
        skipped: acc.skipped + row.skipped,
        errors: acc.errors + row.errors,
      }),
      { read: 0, written: 0, skipped: 0, errors: 0 },
    );

    console.log('-'.repeat(header.length));
    console.log(
      `TOTAL: ${totals.read} lidos | ${totals.written} ${dryRun ? 'simulados' : 'gravados'} | ` +
        `${totals.skipped} pulados | ${totals.errors} erros`,
    );

    const issues = this.issuesByReason();
    if (issues.length > 0) {
      console.log('\nOcorrências (passo :: tipo :: motivo):');
      for (const issue of issues.slice(0, 30)) {
        console.log(`  ${String(issue.count).padStart(7)}x  ${issue.key}`);
      }
      if (issues.length > 30) console.log(`  ... e mais ${issues.length - 30} tipos de ocorrência`);
    }
  }

  save(reportPath: string, meta: Record<string, unknown>): void {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    const payload = {
      startedAt: this.startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      meta,
      steps: [...this.stats.values()],
      issueCounts: this.issuesByReason(),
      samples: this.samples,
    };
    fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2), 'utf8');
  }

  hasErrors(): boolean {
    return [...this.stats.values()].some((stat) => stat.errors > 0 || stat.status === 'failed');
  }
}
