import { ensureAppSchema, getAppDb, nowIso, type Scope } from "./appDb";

/*
 * Every helper takes an explicit Scope. review_run_steps is future fine-tuning data:
 * keep its JSON columns raw, never summarized at write time.
 */

export type ReviewRunStatus = "running" | "completed" | "failed";
export type ReviewStepKind = "init" | "gather" | "assess" | "rule" | "finalize";

export interface InsertReviewRunArgs {
  id: string;
  decisionId: string;
  userId: string;
  filingId: string;
}

export async function insertReviewRun(scope: Scope, args: InsertReviewRunArgs): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `INSERT INTO review_runs (id, decision_id, user_id, filing_id, status, started_at)
          VALUES (?, ?, ?, ?, 'running', ?)`,
    args: [args.id, args.decisionId, args.userId, args.filingId, nowIso()],
  });
  void scope;
}

export interface CompleteReviewRunArgs {
  id: string;
  status: Exclude<ReviewRunStatus, "running">;
  finalVerdict: string | null;
  iterationCount: number;
  durationMs: number;
  error?: string;
}

export async function completeReviewRun(scope: Scope, args: CompleteReviewRunArgs): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `UPDATE review_runs
          SET status = ?, final_verdict = ?, iteration_count = ?, duration_ms = ?,
              completed_at = ?, error = ?
          WHERE id = ? AND filing_id = ?`,
    args: [
      args.status,
      args.finalVerdict,
      args.iterationCount,
      args.durationMs,
      nowIso(),
      args.error ?? null,
      args.id,
      scope.filingId,
    ],
  });
}

export interface RecordStepArgs {
  id: string;
  runId: string;
  userId: string;
  filingId: string;
  iteration: number;
  stepKind: ReviewStepKind;
  input: unknown;
  output: unknown;
  durationMs: number;
}

export async function recordReviewStep(scope: Scope, args: RecordStepArgs): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `INSERT INTO review_run_steps
            (id, run_id, user_id, filing_id, iteration, step_kind, input_json, output_json, duration_ms, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      args.id,
      args.runId,
      args.userId,
      args.filingId,
      args.iteration,
      args.stepKind,
      JSON.stringify(args.input ?? null),
      JSON.stringify(args.output ?? null),
      args.durationMs,
      nowIso(),
    ],
  });
  void scope;
}

export async function setDecisionLatestRunId(
  scope: Scope,
  decisionId: string,
  runId: string,
): Promise<void> {
  await ensureAppSchema();
  await getAppDb().execute({
    sql: `UPDATE ai_decisions SET latest_review_run_id = ? WHERE id = ? AND filing_id = ?`,
    args: [runId, decisionId, scope.filingId],
  });
}
