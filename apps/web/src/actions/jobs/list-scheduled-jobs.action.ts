"use server";

import { z } from "zod";
import { executeAction, type ActionResult } from "@/actions/_core";
import { apiRequest } from "@/lib/api";
import type { ScheduledJobDto } from "@/lib/api/dto";

const schema = z.object({});

export type ListScheduledJobsInput = z.infer<typeof schema>;

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
    schema,
    auth: "required",
    run: (_input, { token }) =>
      apiRequest<{ ok: boolean; jobs: ScheduledJobDto[] }>("/jobs", {
        token,
        revalidate: false,
      }).then((response) => response.jobs),
  });
}
