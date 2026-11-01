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

const key = (result: CaseResult) => `${result.flow}\u0000${result.model}\u0000${result.name}`;
const pct = (share: number) => `${Math.round(share * 100)}%`;

function totals(cases: CaseResult[]): string[] {
  const groups = new Map<string, CaseResult[]>();
  for (const result of cases) {
    const groupKey = `${result.flow}\u0000${result.model}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), result]);
  }
  return [...groups.entries()].map(([groupKey, cs]) => {
    const [flow, model] = groupKey.split("\u0000");
    if (flow === "ingest") {
      const mean = cs.reduce((total, result) => total + result.score, 0) / cs.length;
      return `- ${flow}, ${model}: ${pct(mean)} of fields over ${cs.length} documents`;
    }
    return `- ${flow}, ${model}: ${cs.filter((result) => result.score === 1).length}/${cs.length} cases`;
  });
}

/* A subset run (--flow=, one model) covers some cases only, so each case's baseline is its newest earlier result. */
function changes(now: CaseResult[], prior: Map<string, CaseResult>): string[] {
  const fresh = now.filter((result) => !prior.has(key(result)));
  const lines = now.flatMap((result) => {
    const previous = prior.get(key(result));
    if (!previous) return [];
    if (result.flow === "ingest")
      return Math.abs(result.score - previous.score) >= INGEST_DRIFT
        ? [`- ${result.model}, ${result.name}: ${pct(previous.score)} → ${pct(result.score)}`]
        : [];
    if (result.score === previous.score) return [];
    return [
      `- ${result.model}, ${result.flow}, ${result.name}: ${result.score ? "now passes" : "now fails"} (${result.note})`,
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
    .filter((name) => name < runId && existsSync(path.join(dir, name, "summary.json")))
    .sort()
    .reverse();
  for (const run of runs) {
    const { cases } = JSON.parse(
      readFileSync(path.join(dir, run, "summary.json"), "utf8"),
    ) as Summary;
    for (const result of cases) if (!prior.has(key(result))) prior.set(key(result), result);
  }
  return prior;
}

export function writeSummary(dir: string, runId: string, cases: CaseResult[]): string {
  const prior = priorCases(dir, runId);
  const failed = cases.filter((result) => result.flow !== "ingest" && result.score !== 1);
  const text = [
    `# Evals lite — ${runId}`,
    "## Totals",
    totals(cases).join("\n"),
    "## Changes since earlier lite runs",
    changes(cases, prior).join("\n"),
    "## Failing now",
    failed.length
      ? failed
          .map((result) => `- ${result.model}, ${result.flow}, ${result.name}: ${result.note}`)
          .join("\n")
      : "None.",
    READING,
  ].join("\n\n");
  writeFileSync(path.join(dir, runId, "summary.json"), JSON.stringify({ runId, cases }, null, 2));
  writeFileSync(path.join(dir, runId, "summary.md"), text + "\n");
  return text;
}
