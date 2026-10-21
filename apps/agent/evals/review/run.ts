/*
 * Review-judge eval: seed a decision and its facts, run the production
 * review-decision workflow, and score the verdict, the cited authority,
 * and whether retrieval found that authority at all.
 *
 *   npx tsx --env-file=.env evals/review/run.ts <model-substring> [--runs=N] [--case=…]   (from apps/agent)
 *
 * One model per run: the judges read JUDGE_MODEL when their module loads.
 * --case=<substring> runs only matching cases and does not publish a
 * report; combine saved runs with report.ts. Memory grows with each review
 * in one process (Node ran out of heap after 13 runs on Gemma 4 31b), so
 * for long runs, start one process per case with --case.
 * Writes .scratch/evals/review/<runId>/results.json and docs/evals/review.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { modelsFromArgs, useModel } from "../lib/models";
import "../lib/tempDb";
import { CASES, type ReviewCase } from "./cases";
import { publishReport, type ReviewResult } from "./report";

const REPO = path.resolve(__dirname, "../../../..");
const YEAR = 2025;

const [model] = modelsFromArgs(process.argv.slice(2));
if (!model) throw new Error("name one model, e.g. gemma4:26b");
useModel("JUDGE", model);

/* Imported after JUDGE_MODEL is set. */
const deps = async () => {
  const { Mastra } = await import("@mastra/core");
  const { queryFormulator } =
    await import("../../src/mastra/workflows/reviewDecision/judges/queryFormulator");
  const { assessRiskAgent } =
    await import("../../src/mastra/workflows/reviewDecision/judges/assessRiskAgent");
  const { ruleAgent } = await import("../../src/mastra/workflows/reviewDecision/judges/ruleAgent");
  const workflow = await import("../../src/mastra/workflows/reviewDecision");
  new Mastra({
    agents: { queryFormulator, assessRiskAgent, ruleAgent },
    workflows: { reviewDecision: workflow.reviewDecisionWorkflow },
  });
  return {
    reviewDecision: workflow.reviewDecision,
    ...(await import("../../src/mastra/db/filings")),
    ...(await import("../../src/mastra/db/taxFacts")),
    ...(await import("../../src/mastra/db/aiDecisions")),
    ...(await import("../../src/mastra/db/appDb")),
    ...(await import("../../src/mastra/db/libsql")),
  };
};
type Deps = Awaited<ReturnType<typeof deps>>;

/* Fail loudly when a labeled block is gone (a parser change renumbers blocks). */
async function checkAuthority(d: Deps) {
  const ids = [...new Set(CASES.flatMap((c) => c.authority.flat()))];
  const res = await d.getCorpusDb().execute({
    sql: `SELECT block_id FROM ref_blocks WHERE block_id IN (${ids.map(() => "?").join(",")})`,
    args: ids,
  });
  const found = new Set(res.rows.map((r) => String(r.block_id)));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length)
    throw new Error(`labeled blocks missing from corpus.db: ${missing.join(", ")}`);
}

async function seed(d: Deps, c: ReviewCase, run: number) {
  const userId = `eval-${run}-${crypto.randomUUID().slice(0, 8)}`;
  const filingId = crypto.randomUUID();
  await d.createOwnerFiling({ filingId, userId, taxYear: YEAR });
  const scope = { userId, filingId };
  const base = { userId, filingId, taxYear: YEAR };
  for (const f of c.facts)
    await d.recordFact(scope, {
      id: crypto.randomUUID(),
      ...base,
      ...f,
      sourceNote: f.sourceNote ?? undefined,
    });
  const decisionId = crypto.randomUUID();
  await d.recordDecision(scope, {
    id: decisionId,
    ...base,
    ...c.decision,
    supportingFactKeys: c.facts.map((f) => f.key),
    confidence: "high",
    sourceNote: "review eval",
  });
  return { scope, decisionId };
}

/* Every block id the gather steps retrieved, from the workflow's step log. */
async function retrievedBlocks(d: Deps, runId: string): Promise<Set<string>> {
  const res = await d.getAppDb().execute({
    sql: `SELECT output_json FROM review_run_steps WHERE run_id = ? AND step_kind = 'gather'`,
    args: [runId],
  });
  const json = res.rows.map((r) => String(r.output_json ?? "")).join("\n");
  return new Set([...json.matchAll(/"blockId":"([^"]+)"/g)].map((m) => m[1]));
}

const hitsAll = (groups: string[][], ids: Set<string>) =>
  groups.every((g) => g.some((id) => ids.has(id)));

async function evalCase(d: Deps, c: ReviewCase, run: number): Promise<ReviewResult> {
  const { scope, decisionId } = await seed(d, c, run);
  const started = Date.now();
  const out = await d.reviewDecision(scope, decisionId);
  const cited = out.citations.map((x) => x.blockId);
  const retrieved = await retrievedBlocks(d, out.reviewRunId);
  return {
    model: model.label,
    case: c.name,
    run,
    expectedVerdict: c.expectedVerdict,
    verdict: out.finalVerdict,
    citedAuthority: hitsAll(c.authority, new Set(cited)),
    retrievedAuthority: hitsAll(c.authority, retrieved),
    cited,
    /* The rule judge must cite only retrieved blocks; fact keys and made-up ids break that. */
    invalidCitations: cited.filter((id) => !retrieved.has(id)),
    iterations: out.iterationCount,
    latencyMs: Date.now() - started,
    reason: out.reason,
  };
}

async function main() {
  const d = await deps();
  await checkAuthority(d);
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(REPO, ".scratch/evals/review", runId);
  mkdirSync(outDir, { recursive: true });
  const caseFilter = process.argv.find((a) => a.startsWith("--case="))?.slice(7);
  const cases = CASES.filter((c) => !caseFilter || c.name.includes(caseFilter));
  console.log(`${cases.length} cases × ${model.runs} runs, ${model.label}`);
  const results: ReviewResult[] = [];
  for (const c of cases)
    for (let run = 1; run <= model.runs; run++) {
      const r = await evalCase(d, c, run);
      console.log(
        `  ${c.name} #${run}: ${r.verdict} (expected ${r.expectedVerdict}), cited ${r.citedAuthority ? "yes" : "no"}, ${(r.latencyMs / 1000).toFixed(0)}s`,
      );
      results.push(r);
      writeFileSync(
        path.join(outDir, "results.json"),
        JSON.stringify({ models: [model], results }, null, 2),
      );
    }
  console.log(`\nResults: ${path.relative(REPO, outDir)}/results.json`);
  if (!caseFilter) console.log(`Report: ${publishReport([{ models: [model], results }])}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
