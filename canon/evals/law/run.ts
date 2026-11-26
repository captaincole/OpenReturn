/*
 *   npm run evals:law    (from the repo root; or `npm run evals:law` from canon)
 *
 * Runs every case's queries through the law search in each mode and writes
 * docs/evals/law.md. The Code cases run on the statute only (source
 * "statute"), then again on the whole library, to count the statute hits
 * the regulations push out of the top 8. The regulation cases run on the
 * whole library, as searchLaw does by default. No model call: hybrid and
 * vector modes embed the queries with the local Ollama model, fts mode
 * needs nothing.
 */
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { LawSource } from "../../src/law/citation";
import { lawDocIdOf, requireLaw } from "../../src/law/lawRead";
import { searchLaw, type LawHit, type SearchMode } from "../../src/law/lawSearch";
import { crowdingOf, type CrowdingRun } from "./crowding";
import { renderReport, type ModeRun } from "./report";
import { mergeByBestRank, scoreCase, TOP_K, type DocIds, type LawCase } from "./score";

const CANON_ROOT = path.resolve(__dirname, "../..");
const REPORT = path.resolve(CANON_ROOT, "../docs/evals/law.md");
const MODES: SearchMode[] = ["hybrid", "fts", "vector"];

// The same env files as the corpus CLI: .env first, then .env.development fills the gaps.
config({ path: path.resolve(CANON_ROOT, ".env"), quiet: true });
config({ path: path.resolve(CANON_ROOT, ".env.development"), quiet: true });

const loadCases = (file: string): LawCase[] =>
  JSON.parse(readFileSync(path.join(__dirname, file), "utf8")) as LawCase[];

async function mergedHits(testCase: LawCase, mode: SearchMode, source?: LawSource) {
  const lists: LawHit[][] = [];
  for (const query of testCase.queries)
    lists.push(await searchLaw({ query, mode, limit: TOP_K, source }));
  return mergeByBestRank(lists);
}

interface ModeResult {
  run: ModeRun;
  crowding: CrowdingRun | null;
}

/** One mode over the cases; with `crowd`, also on the whole library, to compare. */
async function runMode(
  cases: LawCase[],
  mode: SearchMode,
  docIds: DocIds,
  opts: { source?: LawSource; crowd: boolean },
): Promise<ModeResult> {
  const started = Date.now();
  const scores = [];
  const pairs = [];
  for (const testCase of cases) {
    const filtered = await mergedHits(testCase, mode, opts.source);
    scores.push(scoreCase(testCase, filtered, docIds));
    if (opts.crowd) {
      const whole = await mergedHits(testCase, mode);
      pairs.push({
        filtered: filtered.slice(0, TOP_K),
        whole: whole.slice(0, TOP_K),
        filteredScore: scores[scores.length - 1],
        wholeScore: scoreCase(testCase, whole, docIds),
      });
    }
  }
  const seconds = (Date.now() - started) / 1000;
  console.log(`[law eval] ${mode}: ${cases.length} cases in ${seconds.toFixed(1)}s`);
  return { run: { mode, scores }, crowding: opts.crowd ? crowdingOf(mode, pairs) : null };
}

async function docIdsOf(): Promise<DocIds> {
  const [statute, regulations] = await Promise.all([
    lawDocIdOf("statute"),
    lawDocIdOf("regulations"),
  ]);
  if (!statute || !regulations)
    throw new Error(
      "law.db needs both the Code and the regulations: run `npm run corpus -- law sync`",
    );
  return { statute, regulations };
}

async function main(): Promise<void> {
  await requireLaw();
  const cases = loadCases("cases.json");
  const regCases = loadCases("regCases.json");
  const docIds = await docIdsOf();
  const statute: ModeResult[] = [];
  const regulations: ModeRun[] = [];
  for (const mode of MODES) {
    statute.push(await runMode(cases, mode, docIds, { source: "statute", crowd: true }));
    regulations.push((await runMode(regCases, mode, docIds, { crowd: false })).run);
  }
  const report = renderReport({
    cases,
    runs: statute.map((result) => result.run),
    crowding: statute.flatMap((result) => (result.crowding ? [result.crowding] : [])),
    regCases,
    regRuns: regulations,
    date: new Date().toLocaleDateString("en-CA"),
  });
  writeFileSync(REPORT, report);
  console.log(report.split("\n## Run it")[0]);
  console.log(`[law eval] wrote ${path.relative(path.resolve(CANON_ROOT, ".."), REPORT)}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
