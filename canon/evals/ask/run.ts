/*
 *   npx tsx --env-file=.env.development evals/ask/run.ts <model-id> [--full] [--runs=N] [--case=…] [--out=dir]   (from canon)
 *
 * One model per run. For long runs, start one process per case with --case. Only a full run
 * publishes the report; the lite tier (the default) writes results.json only.
 */
import { Mastra } from "@mastra/core";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCorpusDb } from "../../src/db/libsql";
import { answerQuestion, type AskStepLog } from "../../src/mastra/workflows/ask";
import { askAnswerer } from "../../src/mastra/workflows/ask/judges/askAnswerer";
import { askQueryFormulator } from "../../src/mastra/workflows/ask/judges/askQueryFormulator";
import { modelsFromArgs, tierFromArgs, useModel } from "../lib/models";
import { CASES, casesFor, type AskCase } from "./cases";
import { correct } from "./flow";
import { publishReport, type AskResult } from "./report";
import { scoreResult } from "./score";

const REPO = path.resolve(__dirname, "../../..");
const OUT_DIR = path.join(REPO, ".scratch/evals/ask");

const ARGS = process.argv.slice(2);
const TIER = tierFromArgs(ARGS);
const [model] = modelsFromArgs(ARGS);
useModel("JUDGE", model);

const mastra = new Mastra({ agents: { askQueryFormulator, askAnswerer } });

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

function retrievedBlocks(steps: AskStepLog[]): Set<string> {
  const json = JSON.stringify(steps.filter((s) => s.kind === "retrieve"));
  return new Set([...json.matchAll(/"blockId":"([^"]+)"/g)].map((m) => m[1]));
}

async function evalCase(c: AskCase, run: number): Promise<AskResult> {
  const steps: AskStepLog[] = [];
  const started = Date.now();
  const result = await answerQuestion(mastra, { question: c.question, steps })
    .then((r) => ({ ...r, error: null as string | null }))
    .catch((err: unknown) => ({
      answer: "",
      coverage: null,
      citations: [] as { blockId: string }[],
      error: err instanceof Error ? err.message : String(err),
    }));
  return scoreResult({
    model: model.label,
    case: c.name,
    run,
    tier: c.tier,
    kind: c.kind,
    expectedCoverage: c.coverage,
    coverage: result.coverage,
    cited: result.citations.map((x) => x.blockId),
    retrieved: [...retrievedBlocks(steps)],
    citedAuthority: null,
    retrievedAuthority: null,
    factsOk: null,
    missingFacts: [],
    answer: result.answer,
    error: result.error,
    latencyMs: Date.now() - started,
  });
}

/* One row per run for the lite summary (cade/evals/lite), which reads no eval code. */
const liteCase = (r: AskResult) => ({
  flow: "ask",
  model: r.model,
  name: r.case,
  run: r.run,
  score: correct(r) ? 1 : 0,
  note: r.error ? `failed: ${r.error}` : `${r.coverage}, expected ${r.expectedCoverage.join("/")}`,
});

function logLine(c: AskCase, run: number, r: AskResult): string {
  const facts =
    r.factsOk === null
      ? ""
      : `, facts ${r.factsOk ? "yes" : `missing ${r.missingFacts.join(", ")}`}`;
  const cited = r.citedAuthority === null ? "" : `, cited ${r.citedAuthority ? "yes" : "no"}`;
  return `  ${c.name} #${run}: ${r.coverage ?? `failed (${r.error})`} (expected ${c.coverage.join("/")})${cited}${facts}, ${(r.latencyMs / 1000).toFixed(0)}s`;
}

async function main() {
  await checkAuthority();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = ARGS.find((a) => a.startsWith("--out="))?.slice(6) ?? path.join(OUT_DIR, runId);
  mkdirSync(outDir, { recursive: true });
  const caseFilter = ARGS.find((a) => a.startsWith("--case="))?.slice(7);
  const cases = casesFor(TIER).filter((c) => !caseFilter || c.name.includes(caseFilter));
  console.log(`${TIER} tier: ${cases.length} cases × ${model.runs} runs, ${model.label}`);
  const results: AskResult[] = [];
  for (const c of cases)
    for (let run = 1; run <= model.runs; run++) {
      const r = await evalCase(c, run);
      console.log(logLine(c, run, r));
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
