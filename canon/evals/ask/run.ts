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
  const ids = [...new Set(CASES.flatMap((testCase) => testCase.authority.flat()))];
  const res = await getCorpusDb().execute({
    sql: `SELECT block_id FROM ref_blocks WHERE block_id IN (${ids.map(() => "?").join(",")})`,
    args: ids,
  });
  const found = new Set(res.rows.map((row) => String(row.block_id)));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length)
    throw new Error(`labeled blocks missing from corpus.db: ${missing.join(", ")}`);
}

function retrievedBlocks(steps: AskStepLog[]): Set<string> {
  const json = JSON.stringify(steps.filter((step) => step.kind === "retrieve"));
  return new Set([...json.matchAll(/"blockId":"([^"]+)"/g)].map((match) => match[1]));
}

async function evalCase(testCase: AskCase, run: number): Promise<AskResult> {
  const steps: AskStepLog[] = [];
  const started = Date.now();
  const result = await answerQuestion(mastra, { question: testCase.question, steps })
    .then((output) => ({ ...output, error: null as string | null }))
    .catch((err: unknown) => ({
      answer: "",
      coverage: null,
      citations: [] as { blockId: string }[],
      error: err instanceof Error ? err.message : String(err),
    }));
  return scoreResult({
    model: model.label,
    case: testCase.name,
    run,
    tier: testCase.tier,
    kind: testCase.kind,
    expectedCoverage: testCase.coverage,
    coverage: result.coverage,
    cited: result.citations.map((citation) => citation.blockId),
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
const liteCase = (result: AskResult) => ({
  flow: "ask",
  model: result.model,
  name: result.case,
  run: result.run,
  score: correct(result) ? 1 : 0,
  note: result.error
    ? `failed: ${result.error}`
    : `${result.coverage}, expected ${result.expectedCoverage.join("/")}`,
});

function logLine(testCase: AskCase, run: number, result: AskResult): string {
  const facts =
    result.factsOk === null
      ? ""
      : `, facts ${result.factsOk ? "yes" : `missing ${result.missingFacts.join(", ")}`}`;
  const cited =
    result.citedAuthority === null ? "" : `, cited ${result.citedAuthority ? "yes" : "no"}`;
  return `  ${testCase.name} #${run}: ${result.coverage ?? `failed (${result.error})`} (expected ${testCase.coverage.join("/")})${cited}${facts}, ${(result.latencyMs / 1000).toFixed(0)}s`;
}

async function main() {
  await checkAuthority();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir =
    ARGS.find((arg) => arg.startsWith("--out="))?.slice(6) ?? path.join(OUT_DIR, runId);
  mkdirSync(outDir, { recursive: true });
  const caseFilter = ARGS.find((arg) => arg.startsWith("--case="))?.slice(7);
  const cases = casesFor(TIER).filter(
    (testCase) => !caseFilter || testCase.name.includes(caseFilter),
  );
  console.log(`${TIER} tier: ${cases.length} cases × ${model.runs} runs, ${model.label}`);
  const results: AskResult[] = [];
  for (const testCase of cases)
    for (let run = 1; run <= model.runs; run++) {
      const result = await evalCase(testCase, run);
      console.log(logLine(testCase, run, result));
      results.push(result);
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
