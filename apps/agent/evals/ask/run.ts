/*
 * Ask The Tax Code eval: ask each question through the production answer
 * pipeline (workflows/askTurn) and score coverage, citations, retrieval
 * and the stated facts.
 *
 *   npx tsx --env-file=.env evals/ask/run.ts <model-substring> [--runs=N] [--case=…]   (from apps/agent)
 *
 * One model per run: the judges read JUDGE_MODEL when their module loads.
 * --case=<substring> runs only matching cases and does not publish a
 * report; combine saved runs with report.ts. As with the review eval, a
 * long run on Gemma 4 31b is safer as one process per case (--case).
 * Writes .scratch/evals/ask/<runId>/results.json and docs/evals/ask.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { modelsFromArgs, useModel } from "../lib/models";
import "../lib/tempDb";
import { CASES, type AskCase } from "./cases";
import { publishReport, type AskResult } from "./report";
import { scoreResult } from "./score";

const REPO = path.resolve(__dirname, "../../../..");

const [model] = modelsFromArgs(process.argv.slice(2));
if (!model) throw new Error("name one model, e.g. gemma4:31b");
useModel("JUDGE", model);

/* Imported after JUDGE_MODEL is set. */
const deps = async () => {
  const { Mastra } = await import("@mastra/core");
  const { askQueryFormulator, askAnswerer, ensureCorpusSchema, getCorpusDb } =
    await import("@openreturn/canon");
  const mastra = new Mastra({ agents: { askQueryFormulator, askAnswerer } });
  return {
    mastra,
    ...(await import("../../src/mastra/workflows/askTurn")),
    ...(await import("../../src/mastra/db/askThreads")),
    ...(await import("../../src/mastra/db/appDb")),
    ensureCorpusSchema,
    getCorpusDb,
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

/* Every block id the retrieve step returned, from the turn's query log. */
async function retrievedBlocks(d: Deps, turnId: string): Promise<Set<string>> {
  const res = await d.getAppDb().execute({
    sql: `SELECT log_json FROM ask_turns WHERE id = ?`,
    args: [turnId],
  });
  const json = String(res.rows[0]?.log_json ?? "");
  return new Set([...json.matchAll(/"blockId":"([^"]+)"/g)].map((m) => m[1]));
}

async function evalCase(d: Deps, c: AskCase, run: number): Promise<AskResult> {
  const userId = `eval-${run}-${crypto.randomUUID().slice(0, 8)}`;
  const { threadId, turnId } = await d.createAskThread(userId, c.question);
  const started = Date.now();
  await d.runAskTurn(d.mastra, userId, threadId, turnId).catch(() => undefined);
  const turn = (await d.getAskThread(userId, threadId))!.turns[0];
  return scoreResult({
    model: model.label,
    case: c.name,
    run,
    tier: c.tier,
    kind: c.kind,
    expectedCoverage: c.coverage,
    coverage: turn.status === "completed" ? turn.coverage : null,
    cited: turn.citations.map((x) => x.blockId),
    retrieved: [...(await retrievedBlocks(d, turnId))],
    citedAuthority: null,
    retrievedAuthority: null,
    factsOk: null,
    missingFacts: [],
    answer: turn.answer ?? "",
    error: turn.status === "failed" ? (turn.error ?? "failed") : null,
    latencyMs: Date.now() - started,
  });
}

function logLine(c: AskCase, run: number, r: AskResult): string {
  const facts =
    r.factsOk === null
      ? ""
      : `, facts ${r.factsOk ? "yes" : `missing ${r.missingFacts.join(", ")}`}`;
  const cited = r.citedAuthority === null ? "" : `, cited ${r.citedAuthority ? "yes" : "no"}`;
  return `  ${c.name} #${run}: ${r.coverage ?? `failed (${r.error})`} (expected ${c.coverage.join("/")})${cited}${facts}, ${(r.latencyMs / 1000).toFixed(0)}s`;
}

async function main() {
  const d = await deps();
  await checkAuthority(d);
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(REPO, ".scratch/evals/ask", runId);
  mkdirSync(outDir, { recursive: true });
  const caseFilter = process.argv.find((a) => a.startsWith("--case="))?.slice(7);
  const cases = CASES.filter((c) => !caseFilter || c.name.includes(caseFilter));
  console.log(`${cases.length} cases × ${model.runs} runs, ${model.label}`);
  const results: AskResult[] = [];
  for (const c of cases)
    for (let run = 1; run <= model.runs; run++) {
      const r = await evalCase(d, c, run);
      console.log(logLine(c, run, r));
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
