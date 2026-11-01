/*
 *   npx tsx --env-file=.env.development evals/review/run.ts <model-id> [--full] [--runs=N] [--case=…] [--out=dir]   (from canon)
 *
 * One model per run. Memory grows with each review in one process, so for long runs start one
 * process per case with --case. Only a full run publishes the report; the
 * lite tier (the default) writes results.json only.
 */
import { Mastra } from "@mastra/core";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCorpusDb } from "../../src/db/libsql";
import { groundDecision } from "../../src/mastra/workflows/ground";
import { assessRiskAgent } from "../../src/mastra/workflows/ground/judges/assessRiskAgent";
import { queryFormulator } from "../../src/mastra/workflows/ground/judges/queryFormulator";
import { ruleAgent } from "../../src/mastra/workflows/ground/judges/ruleAgent";
import type { GroundStepLog } from "../../src/mastra/workflows/ground/schemas";
import { hitsAll } from "../lib/anyOf";
import { modelsFromArgs, tierFromArgs, useModel } from "../lib/models";
import { CASES, casesFor, type ReviewCase } from "./cases";
import { verdictOk } from "./flow";
import { publishReport, type ReviewResult } from "./report";

const REPO = path.resolve(__dirname, "../../..");
const OUT_DIR = path.join(REPO, ".scratch/evals/review");
const YEAR = 2025;

const ARGS = process.argv.slice(2);
const TIER = tierFromArgs(ARGS);
const [model] = modelsFromArgs(ARGS);
useModel("JUDGE", model);

const mastra = new Mastra({ agents: { queryFormulator, assessRiskAgent, ruleAgent } });

/* Fail loudly when a labeled block is gone (a parser change renumbers blocks). */
async function checkAuthority() {
  const ids = [...new Set(CASES.flatMap((c) => c.authority.flat()))];
  const res = await getCorpusDb().execute({
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

async function evalCase(c: ReviewCase, run: number): Promise<ReviewResult> {
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
  const out = await groundDecision(mastra, input, { steps }).catch((err: unknown) => ({
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

/* One row per run for the lite summary (cade/evals/lite), which reads no eval code. */
const liteCase = (r: ReviewResult) => ({
  flow: "review",
  model: r.model,
  name: r.case,
  run: r.run,
  score: verdictOk(r) ? 1 : 0,
  note: `${r.verdict}, expected ${r.expectedVerdict}`,
});

async function main() {
  await checkAuthority();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = ARGS.find((a) => a.startsWith("--out="))?.slice(6) ?? path.join(OUT_DIR, runId);
  mkdirSync(outDir, { recursive: true });
  const caseFilter = ARGS.find((a) => a.startsWith("--case="))?.slice(7);
  const cases = casesFor(TIER).filter((c) => !caseFilter || c.name.includes(caseFilter));
  console.log(`${TIER} tier: ${cases.length} cases × ${model.runs} runs, ${model.label}`);
  const results: ReviewResult[] = [];
  for (const c of cases)
    for (let run = 1; run <= model.runs; run++) {
      const r = await evalCase(c, run);
      console.log(
        `  ${c.name} #${run}: ${r.verdict} (expected ${r.expectedVerdict}), cited ${r.citedAuthority ? "yes" : "no"}, ${(r.latencyMs / 1000).toFixed(0)}s`,
      );
      results.push(r);
      writeFileSync(
        path.join(outDir, "results.json"),
        JSON.stringify({ models: [model], results, cases: results.map(liteCase) }, null, 2),
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
