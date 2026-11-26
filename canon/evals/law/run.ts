/*
 *   npm run evals:law    (from the repo root; or `npm run evals:law` from canon)
 *
 * Runs every case's queries through the law search in each mode and writes
 * docs/evals/law.md. No model call: hybrid and vector modes embed the
 * queries with the local Ollama model, fts mode needs nothing.
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { lawDocId, requireLaw } from "../../src/law/lawRead";
import { searchLaw, type SearchMode } from "../../src/law/lawSearch";
import { renderReport, type ModeRun } from "./report";
import { mergeByBestRank, scoreCase, TOP_K, type CaseScore, type LawCase } from "./score";

const CANON_ROOT = path.resolve(__dirname, "../..");
const REPORT = path.resolve(CANON_ROOT, "../docs/evals/law.md");
const MODES: SearchMode[] = ["hybrid", "fts", "vector"];

// The same env files as the corpus CLI: .env first, then .env.development fills the gaps.
config({ path: path.resolve(CANON_ROOT, ".env"), quiet: true });
config({ path: path.resolve(CANON_ROOT, ".env.development"), quiet: true });

const loadCases = (): LawCase[] =>
  JSON.parse(readFileSync(path.join(__dirname, "cases.json"), "utf8")) as LawCase[];

async function runCase(testCase: LawCase, mode: SearchMode, docId: string): Promise<CaseScore> {
  const lists = [];
  for (const query of testCase.queries) lists.push(await searchLaw({ query, mode, limit: TOP_K }));
  return scoreCase(testCase, mergeByBestRank(lists), docId);
}

async function runMode(cases: LawCase[], mode: SearchMode, docId: string): Promise<ModeRun> {
  const started = Date.now();
  const scores: CaseScore[] = [];
  for (const testCase of cases) scores.push(await runCase(testCase, mode, docId));
  const seconds = (Date.now() - started) / 1000;
  console.log(`[law eval] ${mode}: ${cases.length} cases in ${seconds.toFixed(1)}s`);
  return { mode, scores };
}

async function main(): Promise<void> {
  await requireLaw();
  const cases = loadCases();
  const docId = await lawDocId();
  const runs: ModeRun[] = [];
  for (const mode of MODES) runs.push(await runMode(cases, mode, docId));
  const report = renderReport(cases, runs, new Date().toLocaleDateString("en-CA"));
  writeFileSync(REPORT, report);
  console.log(report.split("\n## Misses")[0]);
  console.log(`[law eval] wrote ${path.relative(path.resolve(CANON_ROOT, ".."), REPORT)}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
