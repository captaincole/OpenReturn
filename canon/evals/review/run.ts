/*
 *   npx tsx --env-file=.env.development evals/review/run.ts <model-substring> [--full] [--runs=N] [--case=…] [--out=dir]   (from canon)
 *
 * One model per run: the judges read JUDGE_MODEL when their module loads.
 * Memory grows with each review in one process, so for long runs start one
 * process per case with --case. Only a full run publishes the report; the
 * lite tier (the default) writes results.json only.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { GroundStepLog } from "../../src/mastra/workflows/ground/schemas";
import { modelsFromArgs, tierFromArgs, useModel } from "../lib/models";
import { CASES, casesFor, type ReviewCase } from "./cases";
import { publishReport, type ReviewResult } from "./report";

const REPO = path.resolve(__dirname, "../../..");
const YEAR = 2025;

const ARGS = process.argv.slice(2);
const TIER = tierFromArgs(ARGS);
const [model] = modelsFromArgs(ARGS);
useModel("JUDGE", model);

/* Imported after JUDGE_MODEL is set. */
const deps = async () => {
  const { Mastra } = await import("@mastra/core");
  const { queryFormulator } =
    await import("../../src/mastra/workflows/ground/judges/queryFormulator");
  const { assessRiskAgent } =
    await import("../../src/mastra/workflows/ground/judges/assessRiskAgent");
  const { ruleAgent } = await import("../../src/mastra/workflows/ground/judges/ruleAgent");
  const { groundDecision } = await import("../../src/mastra/workflows/ground");
  const { getCorpusDb } = await import("../../src/db/libsql");
  const mastra = new Mastra({ agents: { queryFormulator, assessRiskAgent, ruleAgent } });
  return { mastra, groundDecision, getCorpusDb };
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

function retrievedBlocks(steps: GroundStepLog[]): Set<string> {
  const json = JSON.stringify(steps.filter((s) => s.kind === "gather").map((s) => s.output));
  return new Set([...json.matchAll(/"blockId":"([^"]+)"/g)].map((m) => m[1]));
}

const hitsAll = (groups: string[][], ids: Set<string>) =>
  groups.every((g) => g.some((id) => ids.has(id)));

async function evalCase(d: Deps, c: ReviewCase, run: number): Promise<ReviewResult> {
  const steps: GroundStepLog[] = [];
  const started = Date.now();
  const input = {
    decision: {
      ...c.decision,
      taxYear: YEAR,
      confidence: "high",
      dissentingConsiderations: null,
      supportingFactKeys: c.facts.map((f) => f.key),
    },
    facts: c.facts.map((f) => ({ ...f, sourceNote: f.sourceNote ?? null })),
  };
  const out = await d.groundDecision(d.mastra, input, { steps }).catch((err: unknown) => ({
    verdict: "review_failed",
    reason: err instanceof Error ? err.message : String(err),
    citations: [] as { blockId: string }[],
    iterationCount: 0,
  }));
  const cited = out.citations.map((x) => x.blockId);
  const retrieved = retrievedBlocks(steps);
  return {
    model: model.label,
    case: c.name,
    run,
    expectedVerdict: c.expectedVerdict,
    verdict: out.verdict,
    citedAuthority: hitsAll(c.authority, new Set(cited)),
    retrievedAuthority: hitsAll(c.authority, retrieved),
    cited,
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
  const outDir =
    ARGS.find((a) => a.startsWith("--out="))?.slice(6) ??
    path.join(REPO, ".scratch/evals/review", runId);
  mkdirSync(outDir, { recursive: true });
  const caseFilter = ARGS.find((a) => a.startsWith("--case="))?.slice(7);
  const cases = casesFor(TIER).filter((c) => !caseFilter || c.name.includes(caseFilter));
  console.log(`${TIER} tier: ${cases.length} cases × ${model.runs} runs, ${model.label}`);
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
  if (!caseFilter && TIER === "full")
    console.log(`Report: ${publishReport([{ models: [model], results }])}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
