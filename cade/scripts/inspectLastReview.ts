/* Usage: npx tsx --env-file=.env.development scripts/inspectLastReview.ts */
import "dotenv/config";
import { ensureAppSchema, getAppDb } from "../src/mastra/db/appDb";

const TRUNCATE_AT = 1500;

function pp(label: string, value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (text == null) return console.log(`${label}: (null)`);
  if (text.length > TRUNCATE_AT) {
    console.log(
      `${label}:\n${text.slice(0, TRUNCATE_AT)}\n  …[truncated ${text.length - TRUNCATE_AT} chars]`,
    );
  } else {
    console.log(`${label}:\n${text}`);
  }
}

const parse = (value: unknown): unknown => (value == null ? null : JSON.parse(String(value)));

async function main() {
  await ensureAppSchema();
  const db = getAppDb();

  const decision = await db.execute(`
    SELECT id, decision_key, decision, verdict, verdict_reason, latest_review_run_id, created_at
    FROM ai_decisions
    ORDER BY created_at DESC
    LIMIT 1
  `);
  if (decision.rows.length === 0) {
    console.log("(no ai_decisions rows yet)");
    return;
  }
  const decisionRow = decision.rows[0];
  console.log("════════════════════════════════════════════════════════════");
  console.log("MOST RECENT ai_decision");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`id:                   ${decisionRow.id}`);
  console.log(`decisionKey:          ${decisionRow.decision_key}`);
  console.log(`decision:             ${JSON.stringify(parse(decisionRow.decision))}`);
  console.log(`verdict:              ${decisionRow.verdict ?? "(null)"}`);
  console.log(`verdict_reason:       ${decisionRow.verdict_reason ?? "(null)"}`);
  console.log(`latest_review_run_id: ${decisionRow.latest_review_run_id ?? "(null)"}`);
  console.log(`created_at:           ${decisionRow.created_at}`);

  if (!decisionRow.latest_review_run_id) {
    console.log("\n(no associated review_run — workflow likely never started)");
    return;
  }
  await printRunWithSteps(db, String(decisionRow.latest_review_run_id));
}

async function printRunWithSteps(db: ReturnType<typeof getAppDb>, runId: string): Promise<void> {
  const run = await db.execute({
    sql: `SELECT id, status, final_verdict, iteration_count, duration_ms, error, started_at, completed_at
          FROM review_runs WHERE id = ?`,
    args: [runId],
  });
  if (run.rows.length === 0) {
    console.log("\n(latest_review_run_id points to a missing review_runs row)");
    return;
  }
  const runRow = run.rows[0];
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("review_run");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`id:              ${runRow.id}`);
  console.log(`status:          ${runRow.status}`);
  console.log(`final_verdict:   ${runRow.final_verdict ?? "(null)"}`);
  console.log(`iteration_count: ${runRow.iteration_count ?? "(null)"}`);
  console.log(`duration_ms:     ${runRow.duration_ms ?? "(null)"}`);
  console.log(`error:           ${runRow.error ?? "(null)"}`);
  console.log(`started_at:      ${runRow.started_at}`);
  console.log(`completed_at:    ${runRow.completed_at ?? "(null)"}`);

  const steps = await db.execute({
    sql: `SELECT step_kind, iteration, duration_ms, input_json, output_json, created_at
          FROM review_run_steps WHERE run_id = ?
          ORDER BY created_at ASC`,
    args: [runId],
  });
  console.log("\n════════════════════════════════════════════════════════════");
  console.log(`review_run_steps (${steps.rows.length} total)`);
  console.log("════════════════════════════════════════════════════════════");
  for (const step of steps.rows) {
    console.log(
      `\n── step: ${step.step_kind} · iter ${step.iteration} · ${step.duration_ms}ms · ${step.created_at}`,
    );
    pp("  input", parse(step.input_json));
    pp("  output", parse(step.output_json));
  }
}

main().catch((err) => {
  console.error("inspect failed:", err);
  process.exit(1);
});
