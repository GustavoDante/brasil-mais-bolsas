"use server";

import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScheduledJobDto } from "@/lib/api/dto";
import { listScheduledJobsInputSchema } from "@/schemas/jobs/list-scheduled-jobs.schema";

/**
 * `GET /v1/jobs` — Lista as tarefas agendadas e a próxima execução (admin).
 *
 * Requer sessão autenticada.
 */
export async function listScheduledJobs(): Promise<
  ActionResult<ScheduledJobDto[]>
> {
  return executeAction({
    input: {},
    schema: listScheduledJobsInputSchema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; jobs: ScheduledJobDto[] }>("/jobs", {
        token,
        revalidate: false
      }).then((response) => response.jobs)
  });
}
