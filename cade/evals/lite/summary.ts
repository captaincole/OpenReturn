/*
 * The lite summary: one line per flow and model, the cases that changed since the
 * last lite run, and a short reading. One flip on a local model is normal variance.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type Flow = "ingest" | "review" | "ask";
export const FLOWS: Flow[] = ["ingest", "review", "ask"];

/* One case of one model: pass/fail, or an ingest score in [0, 1]. */
export interface CaseResult {
  flow: Flow;
  model: string;
  name: string;
  score: number;
  note: string;
}
interface Summary {
  runId: string;
  cases: CaseResult[];
}

const INGEST_DRIFT = 0.1;

type Ask = {
  model: string;
  case: string;
  coverage: string | null;
  expectedCoverage: string[];
  citedAuthority: boolean | null;
  factsOk: boolean | null;
  error: string | null;
};
type Review = { model: string; case: string; verdict: string; expectedVerdict: string };
type Ingest = { model: string; doc: string; score: { score: number }; error?: string };

/* The same rule as canon/evals/ask/flow.ts `correct`. */
const askPassed = (r: Ask) =>
  r.coverage !== null &&
  r.expectedCoverage.includes(r.coverage) &&
  (r.citedAuthority === null || !r.expectedCoverage.includes("covered") || r.citedAuthority) &&
  r.factsOk !== false;

export function fromResults(flow: Flow, file: string): CaseResult[] {
  if (!existsSync(file)) return [];
  const { results } = JSON.parse(readFileSync(file, "utf8")) as { results: unknown[] };
  if (flow === "ask")
    return (results as Ask[]).map((r) => ({
      flow,
      model: r.model,
      name: r.case,
      score: askPassed(r) ? 1 : 0,
      note: r.error
        ? `failed: ${r.error}`
        : `${r.coverage}, expected ${r.expectedCoverage.join("/")}`,
    }));
  if (flow === "review")
    return (results as Review[]).map((r) => ({
      flow,
      model: r.model,
      name: r.case,
      score: r.verdict === r.expectedVerdict ? 1 : 0,
      note: `${r.verdict}, expected ${r.expectedVerdict}`,
    }));
  return (results as Ingest[]).map((r) => ({
    flow,
    model: r.model,
    name: r.doc,
    score: r.error ? 0 : r.score.score,
    note: r.error ? `failed: ${r.error}` : `${Math.round(r.score.score * 100)}% of fields`,
  }));
}

const key = (c: CaseResult) => `${c.flow}\u0000${c.model}\u0000${c.name}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

function totals(cases: CaseResult[]): string[] {
  const groups = new Map<string, CaseResult[]>();
  for (const c of cases) {
    const k = `${c.flow}\u0000${c.model}`;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  return [...groups.entries()].map(([k, cs]) => {
    const [flow, model] = k.split("\u0000");
    if (flow === "ingest") {
      const mean = cs.reduce((s, c) => s + c.score, 0) / cs.length;
      return `- ${flow}, ${model}: ${pct(mean)} of fields over ${cs.length} documents`;
    }
    return `- ${flow}, ${model}: ${cs.filter((c) => c.score === 1).length}/${cs.length} cases`;
  });
}

function changes(now: CaseResult[], before: Summary | null): string[] {
  if (!before) return ["First lite run: nothing to compare with."];
  const prior = new Map(before.cases.map((c) => [key(c), c]));
  const lines = now.flatMap((c) => {
    const p = prior.get(key(c));
    if (!p) return [];
    if (c.flow === "ingest")
      return Math.abs(c.score - p.score) >= INGEST_DRIFT
        ? [`- ${c.model}, ${c.name}: ${pct(p.score)} → ${pct(c.score)}`]
        : [];
    if (c.score === p.score) return [];
    return [
      `- ${c.model}, ${c.flow}, ${c.name}: ${c.score ? "now passes" : "now fails"} (${c.note})`,
    ];
  });
  return lines.length ? lines : [`No case changed since ${before.runId}.`];
}

const READING =
  "A flip or two on a local model is normal run-to-run variance. Several flips in one flow, or a Haiku flip, deserve a look: run that case alone (`--case=` or `--doc=`) before you debug.";

export function previousRun(dir: string, runId: string): Summary | null {
  const runs = readdirSync(dir)
    .filter((d) => d !== runId && existsSync(path.join(dir, d, "summary.json")))
    .sort();
  const last = runs.at(-1);
  return last
    ? (JSON.parse(readFileSync(path.join(dir, last, "summary.json"), "utf8")) as Summary)
    : null;
}

export function writeSummary(dir: string, runId: string, cases: CaseResult[]): string {
  const before = previousRun(dir, runId);
  const failed = cases.filter((c) => c.flow !== "ingest" && c.score !== 1);
  const text = [
    `# Evals lite — ${runId}`,
    "## Totals",
    totals(cases).join("\n"),
    `## Changes since the last lite run${before ? ` (${before.runId})` : ""}`,
    changes(cases, before).join("\n"),
    "## Failing now",
    failed.length
      ? failed.map((c) => `- ${c.model}, ${c.flow}, ${c.name}: ${c.note}`).join("\n")
      : "None.",
    READING,
  ].join("\n\n");
  writeFileSync(path.join(dir, runId, "summary.json"), JSON.stringify({ runId, cases }, null, 2));
  writeFileSync(path.join(dir, runId, "summary.md"), text + "\n");
  return text;
}
