/*
 * Combines saved runs, rescored against the current labels; a later file
 * replaces a model's rows for the cases it ran:
 *   npx tsx evals/ask/report.ts <results.json>…   (from canon)
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { avg, table } from "../lib/markdown";
import { forDisplay, type EvalModel } from "../lib/models";
import { publishOverview } from "../lib/overview";
import type { Kind, Tier } from "./cases";
import {
  askFlowScores,
  correct,
  coverageOk,
  coveredButWrong,
  groundedOk,
  shouldGround,
} from "./flow";
import { scoreResult } from "./score";

export interface AskResult {
  model: string;
  case: string;
  run: number;
  tier: Tier;
  kind: Kind;
  expectedCoverage: string[];
  coverage: string | null;
  cited: string[];
  /* Missing in older saved runs. */
  retrieved?: string[];
  citedAuthority: boolean | null;
  retrievedAuthority: boolean | null;
  factsOk: boolean | null;
  missingFacts: string[];
  answer: string;
  error: string | null;
  latencyMs: number;
}

export interface AskRun {
  models: EvalModel[];
  results: AskResult[];
}

const REPO = path.resolve(__dirname, "../../..");
const OUT = path.join(REPO, "docs/evals/ask.md");

const count = (rs: AskResult[], pred: (r: AskResult) => boolean) =>
  `${rs.filter(pred).length}/${rs.length}`;
const where = (rs: AskResult[], pred: (r: AskResult) => boolean) => rs.filter(pred);

function summaryTable(models: EvalModel[], results: AskResult[]): string {
  const rows = models.map((model) => {
    const mine = results.filter((result) => result.model === model.label);
    return [
      model.label,
      String(model.runs),
      count(mine, correct),
      count(mine, coveredButWrong),
      count(mine, coverageOk),
      count(where(mine, shouldGround), groundedOk),
      count(
        where(mine, (result) => result.retrievedAuthority !== null),
        (result) => result.retrievedAuthority === true,
      ),
      count(
        where(mine, (result) => result.factsOk !== null),
        (result) => result.factsOk === true,
      ),
      count(mine, (result) => result.error !== null),
      `${(avg(mine.map((result) => result.latencyMs)) / 1000).toFixed(0)}s`,
    ];
  });
  return table(
    [
      "Model",
      "Runs per case",
      "Correct",
      "Covered but wrong",
      "Coverage right",
      "Grounded",
      "Authority retrieved",
      "Facts stated",
      "Turn failed",
      "Avg time",
    ],
    rows,
  );
}

const KIND_LABEL: Record<Kind, string> = {
  standard: "standard",
  false_premise: "false premise",
  insufficient: "insufficient info",
};

function groupTable(models: EvalModel[], results: AskResult[]): string {
  const groups = [...new Set(results.map((result) => `${result.tier}\u0000${result.kind}`))];
  const cell = (rs: AskResult[]) => {
    if (!rs.length) return "—";
    const parts = [`correct ${count(rs, correct)}`, `label ${count(rs, coverageOk)}`];
    const grounded = where(rs, shouldGround);
    if (grounded.length) parts.push(`cited ${count(grounded, groundedOk)}`);
    const facts = where(rs, (result) => result.factsOk !== null);
    if (facts.length) parts.push(`facts ${count(facts, (result) => result.factsOk === true)}`);
    return parts.join(" · ");
  };
  const rows = groups.map((group) => {
    const [tier, kind] = group.split("\u0000");
    const mine = results.filter((result) => String(result.tier) === tier && result.kind === kind);
    return [
      tier,
      KIND_LABEL[kind as Kind],
      ...models.map((model) => cell(mine.filter((result) => result.model === model.label))),
    ];
  });
  return table(["Tier", "Kind", ...models.map((model) => model.label)], rows);
}

function caseCell(rs: AskResult[]): string {
  if (!rs.length) return "—";
  const labels = [...new Set(rs.map((result) => result.coverage ?? "failed"))].join(", ");
  const parts = [`**${count(rs, correct)}** · label ${count(rs, coverageOk)} (${labels})`];
  if (rs[0].citedAuthority !== null) parts.push(`cited ${count(rs, groundedOk)}`);
  if (rs[0].retrievedAuthority !== null)
    parts.push(`retrieved ${count(rs, (result) => result.retrievedAuthority === true)}`);
  if (rs[0].factsOk !== null) parts.push(`facts ${count(rs, (result) => result.factsOk === true)}`);
  return parts.join(" · ");
}

function caseTable(models: EvalModel[], results: AskResult[]): string {
  const cases = [...new Set(results.map((result) => result.case))];
  const rows = cases.map((testCase) => {
    const first = results.find((result) => result.case === testCase)!;
    return [
      testCase,
      String(first.tier),
      KIND_LABEL[first.kind],
      first.expectedCoverage.join(" or "),
      ...models.map((model) =>
        caseCell(
          results.filter((result) => result.model === model.label && result.case === testCase),
        ),
      ),
    ];
  });
  return table(["Case", "Tier", "Kind", "Expected", ...models.map((model) => model.label)], rows);
}

export function renderReport(models: EvalModel[], results: AskResult[]): string {
  return [
    "# Ask The Tax Code eval",
    `_Generated by \`canon/evals/ask\` on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand._`,
    "Each case asks one question through the production Ask pipeline (query formulator, hybrid retrieval over the IRS/FTB corpus, answerer, citation check). The cases, their expected passages and the facts each answer must state are in `canon/evals/ask/` (`cases.ts` and the tier files).",
    "Three tiers: (1) one rule, one obvious passage; (2) generally accepted answers that take a closer read or two passages; (3) two or more passages, usually federal and California. Each tier has 6 standard questions (tier 3 has 7), 2 that assert a wrong amount or rule the answer must correct (false premise; tier 3 has 3), and 2 the library cannot support (insufficient info: the right answer says not covered, or partial). Coverage is about the library: a question about the taxpayer's own numbers is covered when the passages give every rule and amount needed (the answer may state the rule instead of computing the total), and a fact the taxpayer left out does not make it partial.",
    "- **Correct:** the coverage label is right, the answer cites a labeled passage for each rule (on a question the library covers), and it states every key fact. This is the headline score; the other columns show which part failed.\n- **Covered but wrong:** the answer says the library covers the question, but the run is not correct. This is the confidently wrong answer.\n- **Coverage right:** the answer's covered / partial / not-covered label is one the case accepts.\n- **Grounded:** on a question the library covers, the answer cites a labeled passage for each rule.\n- **Authority retrieved:** the search, from the formulator's own queries, found a labeled passage at all. A miss here is a retrieval problem, not an answerer problem.\n- **Facts stated:** the answer states the key amount (any accepted spelling).",
    `Models: ${models.map((model) => `${model.label} (\`${model.id}\`)`).join(", ")}.`,
    "## Summary",
    summaryTable(models, results),
    "## By tier and kind",
    groupTable(models, results),
    "## By case",
    caseTable(models, results),
    "## Run it",
    "From `canon`, with Ollama running (retrieval embeds queries locally):\n\n```bash\nnpx tsx --env-file=.env.development evals/ask/run.ts <model-id> --full [--runs=N] [--case=…]\n```\n\nThe lite tier is `npm run evals:lite` from the repo root.",
  ].join("\n\n");
}

export function publishReport(runs: AskRun[]): string {
  const models = new Map<string, EvalModel>();
  const results = new Map<string, AskResult[]>();
  for (const run of runs) {
    for (const model of run.models) models.set(model.label, model);
    const fresh = new Map<string, AskResult[]>();
    for (const result of run.results) {
      const key = `${result.model}\u0000${result.case}`;
      fresh.set(key, [...(fresh.get(key) ?? []), scoreResult(result)]);
    }
    for (const [key, rs] of fresh) results.set(key, rs);
  }
  const all = [...results.values()].flat();
  const used = [...models.values()].filter((model) =>
    all.some((result) => result.model === model.label),
  );
  const shown = forDisplay(used, all);
  writeFileSync(OUT, renderReport(shown.models, shown.results) + "\n");
  publishOverview(askFlowScores(shown.models, shown.results));
  return path.relative(REPO, OUT);
}

if (require.main === module) {
  const runs = process.argv
    .slice(2)
    .map((file) => JSON.parse(readFileSync(file, "utf8")) as AskRun);
  console.log(publishReport(runs));
}
