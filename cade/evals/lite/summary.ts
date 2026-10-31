/*
 * The lite summary: one line per flow and model, the cases that changed since
 * earlier lite runs, and a short reading. One flip on a local model is normal variance.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type Flow = "ingest" | "review" | "ask";
export const FLOWS: Flow[] = ["ingest", "review", "ask"];

/* One case of one model, as each eval's run.ts writes it: pass/fail, or an ingest score in [0, 1]. */
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

export function fromResults(file: string): CaseResult[] {
  if (!existsSync(file)) return [];
  const { cases } = JSON.parse(readFileSync(file, "utf8")) as { cases?: CaseResult[] };
  return cases ?? [];
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

/* A subset run (--flow=, one model) covers some cases only, so each case's baseline is its newest earlier result. */
function changes(now: CaseResult[], prior: Map<string, CaseResult>): string[] {
  const fresh = now.filter((c) => !prior.has(key(c)));
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
  if (fresh.length === now.length) return ["No earlier lite run covers these cases."];
  const noted = fresh.length ? [`${fresh.length} cases have no earlier result.`] : [];
  return [...(lines.length ? lines : ["No case changed."]), ...noted];
}

const READING =
  "A flip or two on a local model is normal run-to-run variance. Several flips in one flow, or a Haiku flip, deserve a look: run that case alone (`--case=` or `--doc=`) before you debug.";

/* Every earlier run's cases, newest first, so each case's baseline is the last time it ran. */
export function priorCases(dir: string, runId: string): Map<string, CaseResult> {
  const prior = new Map<string, CaseResult>();
  const runs = readdirSync(dir)
    .filter((d) => d < runId && existsSync(path.join(dir, d, "summary.json")))
    .sort()
    .reverse();
  for (const run of runs) {
    const { cases } = JSON.parse(
      readFileSync(path.join(dir, run, "summary.json"), "utf8"),
    ) as Summary;
    for (const c of cases) if (!prior.has(key(c))) prior.set(key(c), c);
  }
  return prior;
}

export function writeSummary(dir: string, runId: string, cases: CaseResult[]): string {
  const prior = priorCases(dir, runId);
  const failed = cases.filter((c) => c.flow !== "ingest" && c.score !== 1);
  const text = [
    `# Evals lite — ${runId}`,
    "## Totals",
    totals(cases).join("\n"),
    "## Changes since earlier lite runs",
    changes(cases, prior).join("\n"),
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
